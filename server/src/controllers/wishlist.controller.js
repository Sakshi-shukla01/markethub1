const asyncHandler = require('../utils/asyncHandler');
const Wishlist = require('../models/Wishlist');

// GET /wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: { path: 'seller', select: 'name avatar' },
  });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  res.json({ success: true, data: wishlist.products });
});

// POST /wishlist/:productId
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

  const exists = wishlist.products.some((p) => p.toString() === productId);
  if (exists) {
    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  } else {
    wishlist.products.push(productId);
  }
  await wishlist.save();
  res.json({ success: true, inWishlist: !exists, data: wishlist.products });
});
