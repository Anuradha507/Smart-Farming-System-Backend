const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: String,
    default: 'ESP32-CAM',
  },
  deviceId: {
    type: String,
    default: 'ESP32-001',
  },
  temperature: {
    type: Number,
    default: null,
  },
  humidity: {
    type: Number,
    default: null,
  },
  soilMoisture: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', imageSchema);
