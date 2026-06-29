const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { processUploads } = require('../middleware/upload');

// PUT /users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const avatars = await processUploads(req);
  const update = {};
  if (name) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (avatars.length) update.avatar = avatars[0];

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});
