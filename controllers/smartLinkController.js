// backend/controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const slugify = require('slugify');

exports.createSmartLink = asyncHandler(async (req, res, next) => {
    const { artistId, trackTitle, releaseDate, coverImageUrl, description, platformLinks, trackingIds, isPublished } = req.body;
    const artist = await Artist.findById(artistId);
    if (!artist) return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));

    const smartLink = await SmartLink.create({
        artistId,
        trackTitle,
        releaseDate,
        coverImageUrl,
        description,
        platformLinks,
        trackingIds,
        isPublished: isPublished || false
    });

    res.status(201).json({ success: true, data: smartLink });
});

exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'populate'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

    let query = SmartLink.find(JSON.parse(queryStr));

    if (req.query.populate === 'artist') {
        query = query.populate({
            path: 'artistId',
            select: 'name slug artistImageUrl'
        });
    }

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await SmartLink.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);
    const smartLinks = await query;

    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
        success: true,
        count: smartLinks.length,
        total,
        pagination,
        data: smartLinks
    });
});

exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
    const smartLink = await SmartLink.findById(req.params.id).populate({
        path: 'artistId',
        select: 'name slug'
    });

    if (!smartLink) return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));

    res.status(200).json({ success: true, data: smartLink });
});

exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
    let smartLink = await SmartLink.findById(req.params.id);
    if (!smartLink) return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));

    const updateData = { ...req.body };

    if (req.body.trackTitle && req.body.trackTitle !== smartLink.trackTitle) {
        const newSlug = slugify(req.body.trackTitle, { lower: true, strict: true });
        const existingSlug = await SmartLink.findOne({
            artistId: smartLink.artistId,
            trackSlug: newSlug,
            _id: { $ne: smartLink._id }
        });
        if (existingSlug) {
            return next(new ErrorResponse(`Un autre SmartLink de cet artiste utilise déjà le slug pour le titre « ${req.body.trackTitle} ».`, 400));
        }
        updateData.trackSlug = newSlug;
    }

    smartLink = await SmartLink.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: smartLink });
});

exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
    const smartLink = await SmartLink.findById(req.params.id);
    if (!smartLink) return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));

    await smartLink.deleteOne();

    res.status(200).json({ success: true, data: {} });
});

exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id');
    if (!artist) return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));

    const smartLinks = await SmartLink.find({
        artistId: artist._id,
        isPublished: true
    }).sort({ releaseDate: -1, createdAt: -1 })
      .select('trackTitle trackSlug coverImageUrl releaseDate');

    res.status(200).json({ success: true, count: smartLinks.length, data: smartLinks });
});

exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('name slug artistImageUrl websiteUrl socialLinks');
    if (!artist) return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));

    const smartLink = await SmartLink.findOne({
        artistId: artist._id,
        trackSlug: req.params.trackSlug,
        isPublished: true
    }).select('-artistId -isPublished -__v');

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé ou non publié pour ${req.params.artistSlug}/${req.params.trackSlug}`, 404));
    }

    const responseData = {
        smartLink: smartLink.toObject(),
        artist: {
            name: artist.name,
            slug: req.params.artistSlug,
            artistImageUrl: artist.artistImageUrl,
            websiteUrl: artist.websiteUrl,
            socialLinks: artist.socialLinks
        }
    };

    res.status(200).json({ success: true, data: responseData });
});
