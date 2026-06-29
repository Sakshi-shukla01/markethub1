const multer = require('multer');
const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const env = require('../config/env');
const cloudinary = require('../config/cloudinary');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Keep files in memory so we can either push to Cloudinary or write to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Uploads a single buffer either to Cloudinary or local disk, returns a URL
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'markethub' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

function saveBufferLocally(buffer, originalname) {
  const ext = path.extname(originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  // Absolute URL so the image loads from the backend (port 5000), not the frontend.
  const base = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${filename}`;
}

// Processes uploaded files into an array of URLs.
// Handles BOTH upload.array() (req.files) and upload.single() (req.file).
async function processUploads(req) {
  const files = req.files && req.files.length ? req.files : req.file ? [req.file] : [];
  if (files.length === 0) return [];
  const urls = [];
  for (const file of files) {
    if (env.isCloudinaryConfigured) {
      urls.push(await uploadBufferToCloudinary(file.buffer));
    } else {
      urls.push(saveBufferLocally(file.buffer, file.originalname));
    }
  }
  return urls;
}

module.exports = { upload, processUploads };