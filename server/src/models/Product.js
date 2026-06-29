const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    condition: { type: String, enum: ['new', 'used'], default: 'used' },
    location: { type: String, default: '' },
    images: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    views: { type: Number, default: 0 },
    isSold: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for MongoDB text search
productSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });
// Helpful filter indexes
productSchema.index({ price: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
