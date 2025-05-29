/**
 * Modèles de données pour MDMC Music Ads v4
 * Exporte tous les modèles pour une utilisation simplifiée
 */

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

// Modèles
db.user = require('./User');
db.role = require('./Role');
db.permission = require('./Permission');
db.artist = require('./Artist');
db.smartLink = require('./SmartLink');
db.accessLog = require('./AccessLog');

module.exports = db;
