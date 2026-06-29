const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Product = require('../models/Product');

const stripe = env.isStripeConfigured ? require('stripe')(env.STRIPE_SECRET_KEY) : null;

// Emits a socket notification to a specific user room
function notifyUser(req, userId, payload) {
  const io = req.app.get('io');
  if (io && userId) io.to(`user:${userId.toString()}`).emit('notification', payload);
}

// POST /orders/create  -> returns Stripe checkout URL, or mock-creates an order
exports.createCheckout = asyncHandler(async (req, res) => {
  // Admins are moderators, not marketplace participants — they cannot buy.
  if (req.user.role === 'admin') {
    throw new ApiError(403, 'Admins cannot buy listings.');
  }
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (product.isSold) throw new ApiError(400, 'Product already sold.');
  if (product.seller.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot buy your own listing.');
  }

  // ----- DEMO MODE: no Stripe key -> create a paid order immediately -----
  if (!stripe) {
    const order = await Order.create({
      buyer: req.user._id,
      product: product._id,
      seller: product.seller,
      amount: product.price,
      currency: 'inr',
      paymentStatus: 'paid',
      paymentMethod: 'mock',
      snapshot: { title: product.title, image: product.images[0] || '' },
    });
    product.isSold = true;
    await product.save();

    notifyUser(req, req.user._id, {
      type: 'order_success',
      message: `Order placed for ${product.title} (demo payment).`,
      orderId: order._id,
    });
    notifyUser(req, product.seller, {
      type: 'product_sold',
      message: `Your listing "${product.title}" was sold!`,
    });

    return res.json({ success: true, mock: true, orderId: order._id, message: 'Demo order created (no Stripe key set).' });
  }

  // ----- REAL STRIPE -----
  const order = await Order.create({
    buyer: req.user._id,
    product: product._id,
    seller: product.seller,
    amount: product.price,
    currency: 'inr',
    paymentStatus: 'pending',
    paymentMethod: 'stripe',
    snapshot: { title: product.title, image: product.images[0] || '' },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: product.title,
            images: product.images.slice(0, 1).filter((u) => u.startsWith('http')),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${env.CLIENT_URL}/orders?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/product/${product._id}?status=cancel`,
    metadata: { orderId: order._id.toString() },
  });

  order.stripeSessionId = session.id;
  await order.save();

  res.json({ success: true, url: session.url, orderId: order._id });
});

// POST /stripe/webhook  (raw body)
exports.stripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe) return res.json({ received: true });

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata && session.metadata.orderId;
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'paid';
      await order.save();
      await Product.findByIdAndUpdate(order.product, { isSold: true });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${order.buyer.toString()}`).emit('notification', {
          type: 'order_success',
          message: 'Payment successful! Your order is confirmed.',
          orderId: order._id,
        });
      }
    }
  }

  res.json({ received: true });
});

// POST /orders/confirm   body: { sessionId }
// Called when the buyer returns from Stripe Checkout. Verifies the session is
// paid and marks the order + product accordingly. This makes the flow work in
// local dev WITHOUT needing the Stripe CLI webhook listener running. It is
// idempotent and the webhook (for production) still works as a backup.
exports.confirmCheckout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!stripe) return res.json({ success: true, message: 'No Stripe configured.' });
  if (!sessionId) throw new ApiError(400, 'Missing sessionId.');

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  // Treat the order as paid if Stripe says the session is paid OR the checkout
  // completed. In test mode (especially INR), payment_status can read 'unpaid'
  // even after a successful test payment, while status becomes 'complete'.
  const isPaid =
    session &&
    (session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required' ||
      session.status === 'complete');
  if (!isPaid) {
    return res.json({ success: false, paid: false, message: 'Payment not completed.' });
  }

  const orderId = session.metadata && session.metadata.orderId;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found.');

  // only act once
  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
    await order.save();
    await Product.findByIdAndUpdate(order.product, { isSold: true });

    notifyUser(req, order.buyer, {
      type: 'order_success',
      message: 'Payment successful! Your order is confirmed.',
      orderId: order._id,
    });
    notifyUser(req, order.seller, {
      type: 'product_sold',
      message: `Your listing "${order.snapshot?.title || 'item'}" was sold!`,
    });
  }

  res.json({ success: true, paid: true, orderId: order._id });
});

// GET /orders/my-orders
exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('product', 'title images price')
    .lean();
  res.json({ success: true, data: orders });
});