// backend/models/URLTracking.js
const mongoose = require("mongoose");

const urlTrackingSchema = new mongoose.Schema(
  {
    smartLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmartLink",
      required: true,
      index: true
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    shortUrl: {
      type: String,
      trim: true
    },
    platform: {
      type: String,
      trim: true,
      index: true
    },
    utmParams: {
      utm_source: { type: String, trim: true, index: true },
      utm_medium: { type: String, trim: true, index: true },
      utm_campaign: { type: String, trim: true, index: true },
      utm_term: { type: String, trim: true },
      utm_content: { type: String, trim: true }
    },
    mdmcParams: {
      mdmc_id: { type: String, trim: true, unique: true },
      mdmc_timestamp: { type: Number },
      mdmc_version: { type: String, trim: true }
    },
    clickData: {
      userAgent: { type: String, trim: true },
      referrer: { type: String, trim: true },
      screenResolution: { type: String, trim: true },
      language: { type: String, trim: true },
      timezone: { type: String, trim: true },
      ipAddress: { type: String, trim: true },
      country: { type: String, trim: true },
      city: { type: String, trim: true }
    },
    platformPosition: {
      type: Number,
      min: 1
    },
    orderSource: {
      type: String,
      enum: ['default', 'custom', 'ab_test', 'regional'],
      default: 'default'
    },
    abTestVariant: {
      type: String,
      trim: true
    },
    destinationUrl: {
      type: String,
      trim: true
    },
    clickCount: {
      type: Number,
      default: 1,
      min: 1
    },
    lastClickAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index composé pour les requêtes d'analytics
urlTrackingSchema.index({ smartLinkId: 1, createdAt: -1 });
urlTrackingSchema.index({ artistId: 1, createdAt: -1 });
urlTrackingSchema.index({ 'utmParams.utm_source': 1, createdAt: -1 });
urlTrackingSchema.index({ 'utmParams.utm_medium': 1, createdAt: -1 });
urlTrackingSchema.index({ platform: 1, createdAt: -1 });

// Méthodes statiques pour analytics
urlTrackingSchema.statics.getClickStatsBySmartLink = function(smartLinkId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchQuery = { smartLinkId };
  
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: "$clickCount" },
        uniqueClicks: { $sum: 1 },
        bySource: {
          $push: {
            source: "$utmParams.utm_source",
            medium: "$utmParams.utm_medium",
            platform: "$platform",
            clicks: "$clickCount"
          }
        }
      }
    },
    {
      $project: {
        totalClicks: 1,
        uniqueClicks: 1,
        topSources: {
          $slice: [
            {
              $sortArray: {
                input: {
                  $reduce: {
                    input: "$bySource",
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        [{ source: "$$this.source", clicks: "$$this.clicks" }]
                      ]
                    }
                  }
                },
                sortBy: { clicks: -1 }
              }
            },
            5
          ]
        }
      }
    }
  ]);
};

urlTrackingSchema.statics.getTopPerformingPlatforms = function(smartLinkId, limit = 10) {
  return this.aggregate([
    { $match: { smartLinkId } },
    {
      $group: {
        _id: "$platform",
        totalClicks: { $sum: "$clickCount" },
        uniqueClicks: { $sum: 1 },
        avgPosition: { $avg: "$platformPosition" }
      }
    },
    { $sort: { totalClicks: -1 } },
    { $limit: limit }
  ]);
};

urlTrackingSchema.statics.getConversionsBySource = function(artistId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchQuery = { artistId };
  
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          source: "$utmParams.utm_source",
          medium: "$utmParams.utm_medium"
        },
        clicks: { $sum: "$clickCount" },
        uniqueVisitors: { $sum: 1 },
        platforms: { $addToSet: "$platform" }
      }
    },
    {
      $project: {
        source: "$_id.source",
        medium: "$_id.medium",
        clicks: 1,
        uniqueVisitors: 1,
        platformCount: { $size: "$platforms" },
        conversionRate: {
          $multiply: [
            { $divide: ["$clicks", "$uniqueVisitors"] },
            100
          ]
        }
      }
    },
    { $sort: { clicks: -1 } }
  ]);
};

const URLTracking = mongoose.model("URLTracking", urlTrackingSchema);

module.exports = URLTracking;