const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour le modèle AccessLog
 */
const AccessLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AccessLog = mongoose.model('AccessLog', AccessLogSchema);

module.exports = AccessLog;
