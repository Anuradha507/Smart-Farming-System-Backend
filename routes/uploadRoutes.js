const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'farm-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// @route   POST /api/upload
// @desc    Upload image from ESP32-CAM or web
// @access  Public (for ESP32) / Private (for web)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Extract sensor data from request body (sent by ESP32)
    const { deviceId, temperature, humidity, soilMoisture } = req.body;

    // Save image metadata to database
    const image = await Image.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      deviceId: deviceId || 'ESP32-001',
      temperature: temperature ? parseFloat(temperature) : null,
      humidity: humidity ? parseFloat(humidity) : null,
      soilMoisture: soilMoisture ? parseFloat(soilMoisture) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: image._id,
        filename: image.filename,
        path: image.path,
        size: image.size,
        deviceId: image.deviceId,
        temperature: image.temperature,
        humidity: image.humidity,
        soilMoisture: image.soilMoisture,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
});

// @route   GET /api/upload/images
// @desc    Get all uploaded images
// @access  Private
router.get('/images', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const images = await Image.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Image.countDocuments();

    res.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ success: false, message: 'Error fetching images' });
  }
});

// @route   GET /api/upload/images/:id
// @desc    Get single image
// @access  Private
router.get('/images/:id', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ success: false, message: 'Error fetching image' });
  }
});

// @route   DELETE /api/upload/images/:id
// @desc    Delete image
// @access  Private
router.delete('/images/:id', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', image.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Image.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ success: false, message: 'Error deleting image' });
  }
});

// @route   GET /api/upload/stats
// @desc    Get upload statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalImages = await Image.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayImages = await Image.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const latestImage = await Image.findOne().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalImages,
        todayImages,
        latestImage: latestImage ? {
          id: latestImage._id,
          path: latestImage.path,
          createdAt: latestImage.createdAt,
          temperature: latestImage.temperature,
          humidity: latestImage.humidity,
          soilMoisture: latestImage.soilMoisture,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

module.exports = router;
