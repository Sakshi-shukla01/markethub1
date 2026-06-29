const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const User = require('../models/User');
const { processUploads } = require('../middleware/upload');

// GET /products  (with search, filter, pagination)
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    condition,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { status: 'approved', isSold: false };
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  // Partial, case-insensitive search across title/description/category/location.
  // This matches as you type ("sam" -> "Samsung"), unlike whole-word $text search.
  if (q && q.trim()) {
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ title: rx }, { description: rx }, { category: rx }, { location: rx }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limitNum)
      .populate('seller', 'name avatar')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// GET /products/search?q=...  (dedicated text search endpoint)
exports.searchProducts = asyncHandler(async (req, res) => {
  const { q = '', limit = 12 } = req.query;
  if (!q.trim()) return res.json({ success: true, data: [] });
  const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(safe, 'i');
  const items = await Product.find({
    status: 'approved',
    isSold: false,
    $or: [{ title: rx }, { description: rx }, { category: rx }, { location: rx }],
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(50, Number(limit)))
    .populate('seller', 'name avatar')
    .lean();
  res.json({ success: true, data: items });
});

// GET /products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name avatar email phone');
  if (!product) throw new ApiError(404, 'Product not found.');

  // increment views
  product.views += 1;
  await product.save();

  // track recently viewed for logged-in user
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { recentlyViewed: product._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { recentlyViewed: { $each: [product._id], $position: 0, $slice: 10 } },
    });
  }

  res.json({ success: true, data: product });
});

// POST /products  (multipart: fields + images[])
exports.createProduct = asyncHandler(async (req, res) => {
  // Admins are moderators, not marketplace participants — they cannot post ads.
  if (req.user.role === 'admin') {
    throw new ApiError(403, 'Admins cannot post listings.');
  }
  const imageUrls = await processUploads(req);
  const { title, description, price, category, condition, location } = req.body;

  if (imageUrls.length === 0 && (!req.body.images || req.body.images.length === 0)) {
    throw new ApiError(400, 'At least one image is required.');
  }

  const product = await Product.create({
    title,
    description,
    price: Number(price),
    category,
    condition: condition || 'used',
    location: location || '',
    images: imageUrls.length ? imageUrls : req.body.images,
    seller: req.user._id,
    status: 'pending',
  });

  // Notify admins of a new product
  const io = req.app.get('io');
  if (io) io.to('admins').emit('notification', {
    type: 'new_product',
    message: `New listing pending approval: ${product.title}`,
    productId: product._id,
  });

  res.status(201).json({ success: true, data: product });
});

// PUT /products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed to edit this listing.');
  }

  const newImages = await processUploads(req);
  const fields = ['title', 'description', 'price', 'category', 'condition', 'location', 'isSold'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = f === 'price' ? Number(req.body[f]) : req.body[f];
  });
  if (newImages.length) product.images = newImages;

  // re-submit for approval if edited by owner
  if (req.user.role !== 'admin') product.status = 'pending';

  await product.save();
  res.json({ success: true, data: product });
});

// DELETE /products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed to delete this listing.');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Listing deleted.' });
});

// GET /products/me/listings  (my ads)
exports.myListings = asyncHandler(async (req, res) => {
  const items = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: items });
});

// GET /products/me/recently-viewed
exports.recentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'recentlyViewed',
    populate: { path: 'seller', select: 'name avatar' },
  });
  res.json({ success: true, data: user ? user.recentlyViewed : [] });
});