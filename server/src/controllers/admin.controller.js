const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// GET /admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: users });
});

// DELETE /admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, 'You cannot delete yourself.');
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted.' });
});

// GET /admin/products?status=pending
exports.getProducts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .populate('seller', 'name email')
    .lean();
  res.json({ success: true, data: products });
});

// PUT /admin/products/:id/approve  body: { action: 'approve' | 'reject' }
exports.moderateProduct = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  // Separation of duties: an admin cannot approve/reject their own listing.
  if (product.seller.toString() === req.user._id.toString()) {
    throw new ApiError(403, 'You cannot moderate your own listing.');
  }

  product.status = action === 'reject' ? 'rejected' : 'approved';
  await product.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${product.seller.toString()}`).emit('notification', {
      type: product.status === 'approved' ? 'listing_approved' : 'listing_rejected',
      message: `Your listing "${product.title}" was ${product.status}.`,
      productId: product._id,
    });
  }

  res.json({ success: true, data: product });
});

// DELETE /admin/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Product deleted.' });
});

// GET /admin/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('buyer', 'name email')
    .populate('product', 'title')
    .lean();
  res.json({ success: true, data: orders });
});

// GET /admin/analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [users, products, orders, pending, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Product.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  // simple 7-day order trend
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trend = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      users,
      products,
      orders,
      pendingProducts: pending,
      revenue: revenueAgg.length ? revenueAgg[0].total : 0,
      trend,
    },
  });
});