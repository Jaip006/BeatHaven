"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const appError_1 = __importDefault(require("../../utils/appError"));
const cloudinary_config_1 = __importDefault(require("../../config/cloudinary.config"));
const beat_model_1 = __importDefault(require("../../models/beat.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const env_config_1 = require("../../config/env.config");
const beatRouter = (0, express_1.Router)();
const STUDIO_HANDLE_REGEX = /^[a-z0-9._-]{3,30}$/;
const normalizeStudioSocials = (socials) => {
    const value = socials && typeof socials === "object" ? socials : {};
    const source = value;
    return {
        instagram: String(source.instagram ?? "").trim(),
        youtube: String(source.youtube ?? "").trim(),
        twitter: String(source.twitter ?? "").trim(),
        spotify: String(source.spotify ?? "").trim(),
        soundcloud: String(source.soundcloud ?? "").trim(),
        website: String(source.website ?? "").trim(),
    };
};
// Memory storage for direct upload to Cloudinary
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const uploadFields = upload.fields([
    { name: "artwork", maxCount: 1 },
    { name: "untaggedMp3", maxCount: 1 },
    { name: "untaggedWav", maxCount: 1 },
    { name: "stems", maxCount: 1 },
]);
const uploadBufferToCloudinary = (buffer, folder, resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_config_1.default.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
            if (error || !result)
                return reject(error || new Error("Cloudinary error"));
            resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(buffer);
    });
};
const ensureCloudinaryConfigured = () => {
    if (!env_config_1.env.CLOUDINARY_CLOUD_NAME || !env_config_1.env.CLOUDINARY_API_KEY || !env_config_1.env.CLOUDINARY_API_SECRET) {
        throw new appError_1.default("Cloudinary is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.", 500, "CLOUDINARY_NOT_CONFIGURED");
    }
};
const derivePublicIdFromUrl = (url) => {
    if (!url)
        return null;
    try {
        const parsed = new URL(url);
        const uploadSegment = "/upload/";
        const uploadIndex = parsed.pathname.indexOf(uploadSegment);
        if (uploadIndex === -1)
            return null;
        const afterUpload = parsed.pathname.slice(uploadIndex + uploadSegment.length);
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
        return withoutExtension || null;
    }
    catch {
        return null;
    }
};
const deleteCloudinaryAsset = async (publicIdOrUrl, resourceType = "image") => {
    const resolvedPublicId = derivePublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl || "";
    if (!resolvedPublicId)
        return;
    try {
        await cloudinary_config_1.default.uploader.destroy(resolvedPublicId, { resource_type: resourceType, invalidate: true });
    }
    catch (error) {
        console.error(`Failed to delete Cloudinary asset (${resourceType}):`, resolvedPublicId, error);
    }
};
beatRouter.post("/", auth_middleware_1.requireAuth, auth_middleware_1.requireSeller, uploadFields, (0, asyncHandler_1.default)(async (req, res) => {
    ensureCloudinaryConfigured();
    const files = req.files;
    if (!files?.artwork?.[0] || !files?.untaggedMp3?.[0]) {
        throw new appError_1.default("Artwork and untagged MP3 are required", 400);
    }
    const { title, beatType, genre, instruments, tempo, musicalKey, moods, tags, isSampleUsed, sampleDetails, freeMp3Enabled, wavEnabled, basicPrice, wavStemsEnabled, premiumPrice, publishingRights, masterRecordings, licensePeriod, exclusiveEnabled, exclusivePrice, exclusiveNegotiable, exclusivePublishingRights, } = req.body;
    // Upload files to Cloudinary
    const artworkUpload = await uploadBufferToCloudinary(files.artwork[0].buffer, "beats/artworks", "image");
    const untaggedMp3Upload = await uploadBufferToCloudinary(files.untaggedMp3[0].buffer, "beats/mp3", "video");
    let untaggedWavUpload = null;
    if (files.untaggedWav?.[0]) {
        untaggedWavUpload = await uploadBufferToCloudinary(files.untaggedWav[0].buffer, "beats/wav", "video");
    }
    let stemsUpload = null;
    if (files.stems?.[0]) {
        stemsUpload = await uploadBufferToCloudinary(files.stems[0].buffer, "beats/stems", "raw");
    }
    // Parse array/json fields if sent as JSON strings from frontend formData
    const parseIfString = (val) => (typeof val === "string" ? JSON.parse(val) : val);
    const newBeat = new beat_model_1.default({
        sellerId: req.user.userId,
        title,
        beatType,
        genre,
        instruments: parseIfString(instruments),
        tempo: Number(tempo),
        musicalKey,
        moods: parseIfString(moods),
        tags: parseIfString(tags),
        isSampleUsed: isSampleUsed === "true",
        sampleDetails: sampleDetails ? parseIfString(sampleDetails) : [],
        artworkUrl: artworkUpload.secureUrl,
        artworkPublicId: artworkUpload.publicId,
        untaggedMp3Url: untaggedMp3Upload.secureUrl,
        untaggedMp3PublicId: untaggedMp3Upload.publicId,
        untaggedWavUrl: untaggedWavUpload?.secureUrl,
        untaggedWavPublicId: untaggedWavUpload?.publicId,
        stemsUrl: stemsUpload?.secureUrl,
        stemsPublicId: stemsUpload?.publicId,
        freeMp3Enabled: freeMp3Enabled === "true",
        wavEnabled: wavEnabled === "true",
        basicPrice: basicPrice ? Number(basicPrice) : undefined,
        wavStemsEnabled: wavStemsEnabled === "true",
        premiumPrice: premiumPrice ? Number(premiumPrice) : undefined,
        publishingRights,
        masterRecordings,
        licensePeriod,
        exclusiveEnabled: exclusiveEnabled === "true",
        exclusivePrice: exclusivePrice ? Number(exclusivePrice) : undefined,
        exclusiveNegotiable: exclusiveNegotiable === "true",
        exclusivePublishingRights,
    });
    await newBeat.save();
    res.status(201).json({
        success: true,
        data: newBeat,
    });
}));
beatRouter.get("/studio", auth_middleware_1.requireAuth, (0, asyncHandler_1.default)(async (req, res) => {
    const requestedHandle = String(req.query?.handle ?? "").trim().toLowerCase();
    const seller = requestedHandle
        ? await user_model_1.default.findOne({ "studioProfile.handle": requestedHandle }).select("displayName avatar createdAt studioProfile mobileVerified aadhaarVerified followers")
        : await user_model_1.default.findById(req.user.userId).select("displayName avatar createdAt studioProfile mobileVerified aadhaarVerified followers");
    if (!seller) {
        throw new appError_1.default("Studio not found", 404);
    }
    const beats = await beat_model_1.default.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    // Dummy stats for now, later sum up real values
    const stats = {
        plays: beats.reduce((acc, b) => acc + (b.plays || 0), 0),
        totalBeats: beats.length,
        followers: seller?.followers?.length || 0,
        verified: true
    };
    const currentUserId = String(req.user.userId);
    const isFollowing = Boolean(seller?.followers?.some((followerId) => String(followerId) === currentUserId));
    const profile = {
        ownerId: seller?._id?.toString() || "",
        studioName: seller?.studioProfile?.studioName || seller?.displayName || "",
        handle: seller?.studioProfile?.handle || "",
        bio: seller?.studioProfile?.bio || "",
        socials: normalizeStudioSocials(seller?.studioProfile?.socials ?? {}),
        avatar: seller?.avatar || "",
        joinedAt: seller?.createdAt || null,
        displayName: seller?.displayName || "",
        mobileVerified: Boolean(seller?.mobileVerified),
        aadhaarVerified: Boolean(seller?.aadhaarVerified),
        isFollowing,
    };
    res.status(200).json({
        success: true,
        data: {
            beats,
            stats,
            profile,
        },
    });
}));
beatRouter.put("/studio/profile", auth_middleware_1.requireAuth, auth_middleware_1.requireSeller, (0, asyncHandler_1.default)(async (req, res) => {
    const studioName = String(req.body?.studioName ?? "").trim();
    const handle = String(req.body?.handle ?? "").trim().toLowerCase();
    const bio = String(req.body?.bio ?? "").trim();
    const socials = normalizeStudioSocials(req.body?.socials ?? {});
    if (studioName.length > 60) {
        throw new appError_1.default("Studio name cannot exceed 60 characters", 400);
    }
    if (bio.length > 280) {
        throw new appError_1.default("Bio cannot exceed 280 characters", 400);
    }
    if (handle && !STUDIO_HANDLE_REGEX.test(handle)) {
        throw new appError_1.default("Handle must be 3-30 chars: lowercase letters, numbers, _ . -", 400);
    }
    const seller = await user_model_1.default.findById(req.user.userId);
    if (!seller) {
        throw new appError_1.default("User not found", 404);
    }
    if (handle) {
        const existingHandleOwner = await user_model_1.default.findOne({
            "studioProfile.handle": handle,
            _id: { $ne: req.user.userId },
        }).select("_id");
        if (existingHandleOwner) {
            throw new appError_1.default("This handle is already taken. Please choose another.", 409);
        }
    }
    seller.studioProfile = {
        ...(seller.studioProfile ?? {}),
        studioName,
        handle,
        bio,
        socials,
    };
    await seller.save();
    res.status(200).json({
        success: true,
        data: {
            profile: {
                ownerId: seller._id?.toString() || "",
                studioName: seller.studioProfile.studioName || seller.displayName || "",
                handle: seller.studioProfile.handle || "",
                bio: seller.studioProfile.bio || "",
                socials: normalizeStudioSocials(seller.studioProfile.socials ?? {}),
                avatar: seller.avatar || "",
                joinedAt: seller.createdAt,
                displayName: seller.displayName,
            },
        },
    });
}));
beatRouter.delete("/:beatId", auth_middleware_1.requireAuth, auth_middleware_1.requireSeller, (0, asyncHandler_1.default)(async (req, res) => {
    const { beatId } = req.params;
    const beat = await beat_model_1.default.findOne({ _id: beatId, sellerId: req.user.userId });
    if (!beat) {
        throw new appError_1.default("Beat not found or you do not have permission to delete it.", 404);
    }
    ensureCloudinaryConfigured();
    await Promise.allSettled([
        deleteCloudinaryAsset(beat.artworkPublicId || beat.artworkUrl, "image"),
        deleteCloudinaryAsset(beat.untaggedMp3PublicId || beat.untaggedMp3Url, "video"),
        deleteCloudinaryAsset(beat.untaggedWavPublicId || beat.untaggedWavUrl, "video"),
        deleteCloudinaryAsset(beat.stemsPublicId || beat.stemsUrl, "raw"),
    ]);
    await beat.deleteOne();
    res.status(200).json({
        success: true,
        message: "Beat deleted successfully.",
        data: {
            beatId,
        },
    });
}));
beatRouter.post("/:beatId/play", auth_middleware_1.requireAuth, (0, asyncHandler_1.default)(async (req, res) => {
    const { beatId } = req.params;
    const beat = await beat_model_1.default.findById(beatId).select("sellerId plays");
    if (!beat) {
        throw new appError_1.default("Beat not found.", 404);
    }
    const isSelfPlay = String(beat.sellerId) === String(req.user.userId);
    if (!isSelfPlay) {
        beat.plays = (beat.plays || 0) + 1;
        await beat.save();
    }
    res.status(200).json({
        success: true,
        data: {
            beatId,
            incremented: !isSelfPlay,
            plays: beat.plays || 0,
        },
    });
}));
beatRouter.post("/studio/follow", auth_middleware_1.requireAuth, (0, asyncHandler_1.default)(async (req, res) => {
    const targetUserId = String(req.body?.targetUserId ?? "").trim();
    if (!targetUserId) {
        throw new appError_1.default("targetUserId is required.", 400);
    }
    if (targetUserId === String(req.user.userId)) {
        throw new appError_1.default("You cannot follow yourself.", 400);
    }
    const targetUser = await user_model_1.default.findById(targetUserId);
    if (!targetUser) {
        throw new appError_1.default("Studio not found.", 404);
    }
    const followerId = String(req.user.userId);
    const alreadyFollowing = targetUser.followers.some((id) => String(id) === followerId);
    if (!alreadyFollowing) {
        targetUser.followers.push(req.user.userId);
        await targetUser.save();
    }
    res.status(200).json({
        success: true,
        data: {
            following: true,
            followers: targetUser.followers.length,
        },
    });
}));
beatRouter.post("/studio/unfollow", auth_middleware_1.requireAuth, (0, asyncHandler_1.default)(async (req, res) => {
    const targetUserId = String(req.body?.targetUserId ?? "").trim();
    if (!targetUserId) {
        throw new appError_1.default("targetUserId is required.", 400);
    }
    const targetUser = await user_model_1.default.findById(targetUserId);
    if (!targetUser) {
        throw new appError_1.default("Studio not found.", 404);
    }
    const followerId = String(req.user.userId);
    targetUser.followers = targetUser.followers.filter((id) => String(id) !== followerId);
    await targetUser.save();
    res.status(200).json({
        success: true,
        data: {
            following: false,
            followers: targetUser.followers.length,
        },
    });
}));
exports.default = beatRouter;
