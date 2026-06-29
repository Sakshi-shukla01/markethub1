const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');

// GET /categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: categories });
});

// POST /categories  (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required.');
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
  const category = await Category.create({ name, slug, icon: icon || '📦' });
  res.status(201).json({ success: true, data: category });
});

// DELETE /categories/:id  (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted.' });
});
