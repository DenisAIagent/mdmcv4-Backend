const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema(
  {
    smartLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartLink',
      required: true,
      index: true
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    // Optionnel : userAgent, ip, etc.
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const Click = mongoose.model('Click', clickSchema);
module.exports = Click; 