const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour le modèle Permission
 */
const PermissionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Permission = mongoose.model('Permission', PermissionSchema);

module.exports = Permission;
