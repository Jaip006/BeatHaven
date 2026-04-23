import { Router } from "express";
import multer from "multer";
import { requireAuth, requireSeller } from "../../middlewares/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import cloudinary from "../../config/cloudinary.config";
import Beat from "../../models/beat.model";
import User from "../../models/user.model";
import Comment from "../../models/comment.model";
import { env } from "../../config/env.config";
import { generateFingerprint, fingerprintSimilarity, SIMILARITY_THRESHOLD } from "../../utils/audioFingerprint";

const beatRouter = Router();

const STUDIO_HANDLE_REGEX = /^[a-z0-9._-]{3,30}$/;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
      }
    } catch {
      // Fall back to plain string parsing below.
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};
const resolveBeatGenre = (genre: unknown, beatType: unknown, tags: unknown): string => {
  const genreCandidate = String(genre ?? "").trim();
  if (genreCandidate && genreCandidate.toLowerCase() !== "unknown") {
    return genreCandidate;
  }

  const beatTypeCandidate = String(beatType ?? "").trim();
  if (beatTypeCandidate && beatTypeCandidate.toLowerCase() !== "unknown") {
    return beatTypeCandidate;
  }

  const normalizedTags = normalizeStringArray(tags);
  if (normalizedTags[0]) {
    return normalizedTags[0];
  }

  return "Unknown";
};
const resolveBeatKey = (key: unknown): string => String(key ?? "").trim();

const normalizeStudioSocials = (socials: unknown) => {
  const value = socials && typeof socials === "object" ? socials : {};
  const source = value as Record<string, unknown>;

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
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "artwork", maxCount: 1 },
  { name: "untaggedMp3", maxCount: 1 },
  { name: "untaggedWav", maxCount: 1 },
  { name: "stems", maxCount: 1 },
]);

const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: "auto" | "image" | "video" | "raw" = "auto"
): Promise<{ secureUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary error"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

const ensureCloudinaryConfigured = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(
      "Cloudinary is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.",
      500,
      "CLOUDINARY_NOT_CONFIGURED"
    );
  }
};

const derivePublicIdFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const uploadSegment = "/upload/";
    const uploadIndex = parsed.pathname.indexOf(uploadSegment);
    if (uploadIndex === -1) return null;
    const afterUpload = parsed.pathname.slice(uploadIndex + uploadSegment.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExtension || null;
  } catch {
    return null;
  }
};

const deleteCloudinaryAsset = async (
  publicIdOrUrl: string | null | undefined,
  resourceType: "image" | "video" | "raw" = "image"
) => {
  const resolvedPublicId = derivePublicIdFromUrl(publicIdOrUrl) || publicIdOrUrl || "";
  if (!resolvedPublicId) return;

  try {
    await cloudinary.uploader.destroy(resolvedPublicId, { resource_type: resourceType, invalidate: true });
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset (${resourceType}):`, resolvedPublicId, error);
  }
};

beatRouter.post(
  "/",
  requireAuth,
  uploadFields,
  asyncHandler(async (req, res) => {
    ensureCloudinaryConfigured();

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.artwork?.[0] || !files?.untaggedMp3?.[0]) {
      throw new AppError("Artwork and untagged MP3 are required", 400);
    }

    const {
      title,
      beatType,
      genre,
      instruments,
      tempo,
      musicalKey,
      moods,
      tags,
      isSampleUsed,
      sampleDetails,
      freeMp3Enabled,
      wavEnabled,
      basicPrice,
      wavStemsEnabled,
      premiumPrice,
      publishingRights,
      masterRecordings,
      licensePeriod,
      exclusiveEnabled,
      exclusivePrice,
      exclusiveNegotiable,
      exclusivePublishingRights,
    } = req.body;

    // Audio fingerprint duplicate detection
    let fingerprintData: { fingerprint: number[]; duration: number } | null = null;
    try {
      fingerprintData = await generateFingerprint(files.untaggedMp3[0].buffer);

      // Load all stored fingerprints and compare — only beats that have a fingerprint
      const existingBeats = await Beat.find(
        { audioFingerprint: { $exists: true, $ne: [] } },
        { audioFingerprint: 1, title: 1, sellerId: 1 }
      ).lean();

      for (const existing of existingBeats) {
        if (!existing.audioFingerprint?.length) continue;
        const similarity = fingerprintSimilarity(fingerprintData.fingerprint, existing.audioFingerprint);
        if (similarity >= SIMILARITY_THRESHOLD) {
          throw new AppError(
            "This audio has already been uploaded. Duplicate beats are not allowed.",
            409,
            "DUPLICATE_AUDIO"
          );
        }
      }
    } catch (err) {
      // Re-throw AppErrors (duplicate detection), swallow fingerprinting tool errors
      if (err instanceof AppError) throw err;
      console.error("Audio fingerprinting failed (skipping duplicate check):", err);
    }

    // Upload files to Cloudinary
    const artworkUpload = await uploadBufferToCloudinary(files.artwork[0].buffer, "beats/artworks", "image");
    const untaggedMp3Upload = await uploadBufferToCloudinary(files.untaggedMp3[0].buffer, "beats/mp3", "video");

    let untaggedWavUpload: { secureUrl: string; publicId: string } | null = null;
    if (files.untaggedWav?.[0]) {
      untaggedWavUpload = await uploadBufferToCloudinary(files.untaggedWav[0].buffer, "beats/wav", "video");
    }

    let stemsUpload: { secureUrl: string; publicId: string } | null = null;
    if (files.stems?.[0]) {
      stemsUpload = await uploadBufferToCloudinary(files.stems[0].buffer, "beats/stems", "raw");
    }

    // Parse array/json fields if sent as JSON strings from frontend formData
    const parseIfString = (val: any) => (typeof val === "string" ? JSON.parse(val) : val);

    const newBeat = new Beat({
      sellerId: req.user!.userId,
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

      audioFingerprint: fingerprintData?.fingerprint,
      audioDuration: fingerprintData?.duration,
    });

    await newBeat.save();

    res.status(201).json({
      success: true,
      data: newBeat,
    });
  })
);

const trendingCache: { data: any; expiresAt: number } = { data: null, expiresAt: 0 };

beatRouter.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query?.limit) || 16, 1), 50);
    const daysAgo = Math.max(Number(req.query?.days) || 30, 1);

    const cacheKey = `${limit}-${daysAgo}`;
    if (trendingCache.data?.key === cacheKey && Date.now() < trendingCache.expiresAt) {
      return res.status(200).json(trendingCache.data.result);
    }

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - daysAgo);

    // Score, sort, and limit inside MongoDB — avoid loading all docs into JS memory
    const beatsWithScore = await Beat.aggregate([
      { $match: { updatedAt: { $gte: recentDate } } },
      { $addFields: { engagementScore: { $add: [{ $multiply: [{ $ifNull: ["$plays", 0] }, 0.3] }, { $multiply: [{ $ifNull: ["$likes", 0] }, 0.7] }] } } },
      { $sort: { engagementScore: -1 } },
      { $limit: limit },
      { $lookup: { from: "users", localField: "sellerId", foreignField: "_id", as: "sellerId", pipeline: [{ $project: { displayName: 1, avatar: 1, studioProfile: 1 } }] } },
      { $unwind: { path: "$sellerId", preserveNullAndEmptyArrays: true } },
    ]);

    // Format response
    const beatResults = beatsWithScore.map((beat: any) => {
      const seller = beat.sellerId || {};
      const producerHandle = String(seller?.studioProfile?.handle ?? "").trim();
      const producerDisplayName = String(seller?.studioProfile?.studioName ?? seller?.displayName ?? "Unknown Producer").trim();
      const normalizedTags = normalizeStringArray(beat.tags);
      const resolvedGenre = resolveBeatGenre(beat.genre, beat.beatType, normalizedTags);
      const resolvedKey = resolveBeatKey(beat.musicalKey);

      return {
        id: String(beat._id),
        title: beat.title,
        genre: resolvedGenre,
        beatType: beat.beatType,
        bpm: Number(beat.tempo ?? 0),
        key: resolvedKey,
        musicalKey: resolvedKey,
        price: Number(beat.basicPrice ?? 0),
        coverImage: beat.artworkUrl,
        audioUrl: beat.untaggedMp3Url,
        producerId: beat.sellerId ? String((beat.sellerId as any)._id ?? "") : "",
        producerName: producerDisplayName,
        producerHandle,
        plays: Number(beat.plays ?? 0),
        likes: Number(beat.likes ?? 0),
        tags: normalizedTags,
        freeMp3Enabled: Boolean(beat.freeMp3Enabled),
      };
    });

    const result = {
      success: true,
      data: {
        beats: beatResults,
        count: beatResults.length,
        period: `${daysAgo} days`,
      },
    };

    trendingCache.data = { key: cacheKey, result };
    trendingCache.expiresAt = Date.now() + 5 * 60 * 1000;

    res.status(200).json(result);
  })
);

beatRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const rawQuery = String(req.query?.q ?? "").trim();
    const genreFilter = String(req.query?.genre ?? "").trim();
    const bpmFilter = String(req.query?.bpm ?? "").trim();
    const limit = Math.min(Math.max(Number(req.query?.limit) || 24, 1), 100);

    const beatFilters: Record<string, unknown> = {};

    if (rawQuery.length > 0) {
      const queryRegex = new RegExp(escapeRegex(rawQuery), "i");

      const matchedSellers = await User.find({
        $or: [
          { displayName: queryRegex },
          { "studioProfile.studioName": queryRegex },
          { "studioProfile.handle": queryRegex },
        ],
      }).select("_id");

      const matchedSellerIds = matchedSellers.map((user) => user._id);
      beatFilters.$or = [
        { title: queryRegex },
        { beatType: queryRegex },
        { genre: queryRegex },
        { tags: queryRegex },
        ...(matchedSellerIds.length > 0 ? [{ sellerId: { $in: matchedSellerIds } }] : []),
      ];
    }

    if (genreFilter && genreFilter.toLowerCase() !== "all") {
      beatFilters.genre = new RegExp(`^${escapeRegex(genreFilter)}$`, "i");
    }

    if (bpmFilter && bpmFilter.toLowerCase() !== "any") {
      if (bpmFilter === "60-90") {
        beatFilters.tempo = { $gte: 60, $lte: 90 };
      } else if (bpmFilter === "91-110") {
        beatFilters.tempo = { $gte: 91, $lte: 110 };
      } else if (bpmFilter === "111-130") {
        beatFilters.tempo = { $gte: 111, $lte: 130 };
      } else if (bpmFilter === "131+") {
        beatFilters.tempo = { $gte: 131 };
      }
    }

    const shouldSearchProducers = rawQuery.length > 0 && !genreFilter && !bpmFilter;

    const [beats, producers] = await Promise.all([
      Beat.find(beatFilters)
        .populate("sellerId", "displayName avatar studioProfile.handle studioProfile.studioName")
        .select("title beatType genre tempo musicalKey tags basicPrice artworkUrl untaggedMp3Url sellerId plays likes freeMp3Enabled")
        .sort({ plays: -1, createdAt: -1 })
        .limit(limit),
      shouldSearchProducers
        ? User.find({
            $or: [
              { displayName: new RegExp(escapeRegex(rawQuery), "i") },
              { "studioProfile.studioName": new RegExp(escapeRegex(rawQuery), "i") },
              { "studioProfile.handle": new RegExp(escapeRegex(rawQuery), "i") },
            ],
            "studioProfile.handle": { $exists: true, $ne: "" },
          })
            .select("displayName avatar studioProfile followers")
            .sort({ createdAt: -1 })
            .limit(limit)
        : Promise.resolve([]),
    ]);

    const beatResults = beats.map((beat) => {
      const seller =
        beat.sellerId && typeof beat.sellerId === "object"
          ? (beat.sellerId as unknown as { displayName?: string; studioProfile?: { handle?: string; studioName?: string } })
          : null;
      const producerHandle = String(seller?.studioProfile?.handle ?? "").trim();
      const producerDisplayName = String(seller?.studioProfile?.studioName ?? seller?.displayName ?? "").trim();
      const normalizedTags = normalizeStringArray(beat.tags);
      const resolvedGenre = resolveBeatGenre(beat.genre, beat.beatType, normalizedTags);
      const resolvedKey = resolveBeatKey(beat.musicalKey);

      return {
        id: String(beat._id),
        title: beat.title,
        genre: resolvedGenre,
        beatType: beat.beatType,
        tempo: beat.tempo,
        key: resolvedKey,
        musicalKey: resolvedKey,
        tags: normalizedTags,
        price: Number(beat.basicPrice ?? 0),
        artworkUrl: beat.artworkUrl,
        coverImage: beat.artworkUrl,
        audioUrl: beat.untaggedMp3Url,
        producerId: beat.sellerId ? String((beat.sellerId as any)._id ?? "") : "",
        producerName: producerDisplayName,
        producerHandle,
        plays: Number(beat.plays ?? 0),
        likes: Number(beat.likes ?? 0),
        freeMp3Enabled: Boolean(beat.freeMp3Enabled),
      };
    });

    const producerResults = producers.map((producer) => {
      const handle = String(producer.studioProfile?.handle ?? "").trim();
      return {
        id: String(producer._id),
        displayName: String(producer.studioProfile?.studioName || producer.displayName || ""),
        handle,
        avatar: String(producer.avatar ?? ""),
        followers: Array.isArray(producer.followers) ? producer.followers.length : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        beats: beatResults,
        producers: producerResults,
      },
    });
  })
);

beatRouter.get(
  "/studio",
  requireAuth,
  asyncHandler(async (req, res) => {
    const requestedHandle = String(req.query?.handle ?? "").trim().toLowerCase();
    const seller = requestedHandle
      ? await User.findOne({ "studioProfile.handle": requestedHandle }).select("displayName avatar createdAt studioProfile mobileVerified aadhaarVerified followers")
      : await User.findById(req.user!.userId).select("displayName avatar createdAt studioProfile mobileVerified aadhaarVerified followers");

    if (!seller) {
      throw new AppError("Studio not found", 404);
    }

    const beats = await Beat.find({ sellerId: seller._id })
      .populate("sellerId", "displayName avatar")
      .sort({ createdAt: -1 });

    // Dummy stats for now, later sum up real values
    const stats = {
      plays: beats.reduce((acc, b) => acc + (b.plays || 0), 0),
      totalBeats: beats.length,
      followers: seller?.followers?.length || 0,
      verified: true
    };
    const currentUserId = String(req.user!.userId);
    const isFollowing = Boolean(
      seller?.followers?.some((followerId) => String(followerId) === currentUserId)
    );

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
  })
);

beatRouter.put(
  "/studio/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const studioName = String(req.body?.studioName ?? "").trim();
    const handle = String(req.body?.handle ?? "").trim().toLowerCase();
    const bio = String(req.body?.bio ?? "").trim();
    const socials = normalizeStudioSocials(req.body?.socials ?? {});

    if (studioName.length > 60) {
      throw new AppError("Studio name cannot exceed 60 characters", 400);
    }
    if (bio.length > 280) {
      throw new AppError("Bio cannot exceed 280 characters", 400);
    }
    if (handle && !STUDIO_HANDLE_REGEX.test(handle)) {
      throw new AppError("Handle must be 3-30 chars: lowercase letters, numbers, _ . -", 400);
    }

    const seller = await User.findById(req.user!.userId).select("_id");
    if (!seller) {
      throw new AppError("User not found", 404);
    }

    if (handle) {
      const existingHandleOwner = await User.findOne({
        "studioProfile.handle": handle,
        _id: { $ne: req.user!.userId },
      }).select("_id");

      if (existingHandleOwner) {
        throw new AppError("This handle is already taken. Please choose another.", 409);
      }
    }

    const updatedSeller = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        $set: {
          "studioProfile.studioName": studioName,
          "studioProfile.handle": handle,
          "studioProfile.bio": bio,
          "studioProfile.socials": socials,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("displayName avatar createdAt studioProfile");

    if (!updatedSeller) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        profile: {
          ownerId: updatedSeller._id?.toString() || "",
          studioName: updatedSeller.studioProfile?.studioName || updatedSeller.displayName || "",
          handle: updatedSeller.studioProfile?.handle || "",
          bio: updatedSeller.studioProfile?.bio || "",
          socials: normalizeStudioSocials(updatedSeller.studioProfile?.socials ?? {}),
          avatar: updatedSeller.avatar || "",
          joinedAt: updatedSeller.createdAt,
          displayName: updatedSeller.displayName,
        },
      },
    });
  })
);

beatRouter.get(
  "/by-producer/:producerId",
  asyncHandler(async (req, res) => {
    const { producerId } = req.params;
    const exclude = String(req.query?.exclude ?? "").trim();
    const limit = Math.min(Math.max(Number(req.query?.limit) || 6, 1), 20);

    const matchQuery: Record<string, unknown> = { sellerId: producerId };
    if (exclude) matchQuery._id = { $ne: exclude };

    const [beats, producer] = await Promise.all([
      Beat.find(matchQuery).sort({ createdAt: -1 }).limit(limit).lean(),
      User.findById(producerId).select("displayName avatar studioProfile").lean(),
    ]);

    const producerDisplayName = String((producer as any)?.studioProfile?.studioName ?? (producer as any)?.displayName ?? "Unknown Producer");
    const producerHandle = String((producer as any)?.studioProfile?.handle ?? "").trim();

    const beatResults = beats.map((beat: any) => {
      const normalizedTags = normalizeStringArray(beat.tags);
      return {
        id: String(beat._id),
        title: beat.title,
        genre: resolveBeatGenre(beat.genre, beat.beatType, normalizedTags),
        beatType: beat.beatType,
        bpm: Number(beat.tempo ?? 0),
        key: resolveBeatKey(beat.musicalKey),
        price: Number(beat.basicPrice ?? 0),
        coverImage: beat.artworkUrl,
        audioUrl: beat.untaggedMp3Url,
        producerId: String(beat.sellerId),
        producerName: producerDisplayName,
        producerHandle,
        plays: Number(beat.plays ?? 0),
        likes: Number(beat.likes ?? 0),
        tags: normalizedTags,
        freeMp3Enabled: Boolean(beat.freeMp3Enabled),
      };
    });

    res.status(200).json({ success: true, data: { beats: beatResults } });
  })
);

beatRouter.get(
  "/:beatId",
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const beat = await Beat.findById(beatId).lean();

    if (!beat) throw new AppError("Beat not found", 404);

    const producer = await User.findById((beat as any).sellerId).select("displayName avatar studioProfile").lean();
    const producerDisplayName = String((producer as any)?.studioProfile?.studioName ?? (producer as any)?.displayName ?? "Unknown Producer");
    const producerHandle = String((producer as any)?.studioProfile?.handle ?? "").trim();
    const normalizedTags = normalizeStringArray((beat as any).tags);

    res.status(200).json({
      success: true,
      data: {
        id: String((beat as any)._id),
        title: (beat as any).title,
        genre: resolveBeatGenre((beat as any).genre, (beat as any).beatType, normalizedTags),
        beatType: (beat as any).beatType,
        bpm: Number((beat as any).tempo ?? 0),
        key: resolveBeatKey((beat as any).musicalKey),
        price: Number((beat as any).basicPrice ?? 0),
        coverImage: (beat as any).artworkUrl,
        audioUrl: (beat as any).untaggedMp3Url,
        producerId: String((beat as any).sellerId),
        producerName: producerDisplayName,
        producerHandle,
        plays: Number((beat as any).plays ?? 0),
        likes: Number((beat as any).likes ?? 0),
        tags: normalizedTags,
        freeMp3Enabled: Boolean((beat as any).freeMp3Enabled),
        moods: normalizeStringArray((beat as any).moods),
        createdAt: (beat as any).createdAt,
      },
    });
  })
);

beatRouter.delete(
  "/:beatId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const beat = await Beat.findOne({ _id: beatId, sellerId: req.user!.userId });

    if (!beat) {
      throw new AppError("Beat not found or you do not have permission to delete it.", 404);
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
  })
);

beatRouter.get(
  "/:beatId/preview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const beat = await Beat.findById(beatId).select(
      "title genre beatType tags tempo musicalKey basicPrice artworkUrl untaggedMp3Url sellerId freeMp3Enabled"
    );

    if (!beat) {
      throw new AppError("Beat not found.", 404);
    }

    const seller = await User.findById(beat.sellerId).select("displayName studioProfile.studioName");
    const producerDisplayName = String(seller?.studioProfile?.studioName ?? seller?.displayName ?? "Unknown Producer");
    const normalizedTags = normalizeStringArray(beat.tags);
    const resolvedGenre = resolveBeatGenre(beat.genre, beat.beatType, normalizedTags);
    const resolvedKey = resolveBeatKey(beat.musicalKey);

    res.status(200).json({
      success: true,
      data: {
        id: String(beat._id),
        title: beat.title,
        genre: resolvedGenre,
        beatType: beat.beatType,
        bpm: Number(beat.tempo ?? 0),
        key: resolvedKey,
        musicalKey: resolvedKey,
        price: Number(beat.basicPrice ?? 0),
        coverImage: beat.artworkUrl,
        audioUrl: beat.untaggedMp3Url,
        tags: normalizedTags,
        producerId: String(beat.sellerId),
        producerName: producerDisplayName,
        freeMp3Enabled: Boolean(beat.freeMp3Enabled),
      },
    });
  })
);

beatRouter.post(
  "/:beatId/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const beat = await Beat.findById(beatId).select(
      "sellerId freeMp3Enabled untaggedMp3Url title genre beatType tags musicalKey"
    );

    if (!beat) {
      throw new AppError("Beat not found.", 404);
    }

    const isOwner = String(beat.sellerId) === String(req.user!.userId);
    if (!isOwner && !beat.freeMp3Enabled) {
      throw new AppError("Free MP3 download is not enabled for this beat.", 403);
    }
    const normalizedTags = normalizeStringArray(beat.tags);
    const resolvedGenre = resolveBeatGenre(beat.genre, beat.beatType, normalizedTags);
    const resolvedKey = resolveBeatKey(beat.musicalKey);

    res.status(200).json({
      success: true,
      data: {
        beatId: String(beat._id),
        title: beat.title,
        downloadUrl: beat.untaggedMp3Url,
        freeMp3Enabled: Boolean(beat.freeMp3Enabled),
        genre: resolvedGenre,
        key: resolvedKey,
      },
    });
  })
);

beatRouter.post(
  "/:beatId/play",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const beat = await Beat.findById(beatId).select("sellerId plays");

    if (!beat) {
      throw new AppError("Beat not found.", 404);
    }

    const isSelfPlay = String(beat.sellerId) === String(req.user!.userId);
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
  })
);

beatRouter.post(
  "/studio/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = String(req.body?.targetUserId ?? "").trim();
    if (!targetUserId) {
      throw new AppError("targetUserId is required.", 400);
    }
    if (targetUserId === String(req.user!.userId)) {
      throw new AppError("You cannot follow yourself.", 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Studio not found.", 404);
    }

    const followerId = String(req.user!.userId);
    const alreadyFollowing = targetUser.followers.some((id) => String(id) === followerId);
    if (!alreadyFollowing) {
      targetUser.followers.push(req.user!.userId as any);
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      data: {
        following: true,
        followers: targetUser.followers.length,
      },
    });
  })
);

beatRouter.post(
  "/studio/unfollow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = String(req.body?.targetUserId ?? "").trim();
    if (!targetUserId) {
      throw new AppError("targetUserId is required.", 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Studio not found.", 404);
    }

    const followerId = String(req.user!.userId);
    targetUser.followers = targetUser.followers.filter((id) => String(id) !== followerId);
    await targetUser.save();

    res.status(200).json({
      success: true,
      data: {
        following: false,
        followers: targetUser.followers.length,
      },
    });
  })
);

// ── Comments ─────────────────────────────────────────────────────────────────

beatRouter.get(
  "/:beatId/comments",
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const limit = Math.min(Math.max(Number(req.query?.limit) || 20, 1), 100);
    const skip = Math.max(Number(req.query?.skip) || 0, 0);

    const [comments, total] = await Promise.all([
      Comment.find({ beatId })
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "displayName avatar studioProfile")
        .lean(),
      Comment.countDocuments({ beatId }),
    ]);

    const formatted = comments.map((c: any) => ({
      id: String(c._id),
      text: c.text,
      pinned: Boolean(c.pinned),
      createdAt: c.createdAt,
      user: {
        id: String(c.userId?._id ?? ""),
        displayName: String(c.userId?.studioProfile?.studioName ?? c.userId?.displayName ?? "Unknown"),
        avatar: String(c.userId?.avatar ?? ""),
      },
    }));

    res.status(200).json({ success: true, data: { comments: formatted, total } });
  })
);

beatRouter.post(
  "/:beatId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId } = req.params;
    const text = String(req.body?.text ?? "").trim();

    if (!text) throw new AppError("Comment text is required", 400);
    if (text.length > 1000) throw new AppError("Comment must be 1000 characters or less", 400);

    const beat = await Beat.findById(beatId).lean();
    if (!beat) throw new AppError("Beat not found", 404);

    const comment = await Comment.create({ beatId, userId: req.user!.userId, text });
    await comment.populate("userId", "displayName avatar studioProfile");

    const c = comment as any;
    res.status(201).json({
      success: true,
      data: {
        id: String(c._id),
        text: c.text,
        pinned: false,
        createdAt: c.createdAt,
        user: {
          id: String(c.userId?._id ?? ""),
          displayName: String(c.userId?.studioProfile?.studioName ?? c.userId?.displayName ?? "Unknown"),
          avatar: String(c.userId?.avatar ?? ""),
        },
      },
    });
  })
);

beatRouter.patch(
  "/:beatId/comments/:commentId/pin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId, commentId } = req.params;

    const beat = await Beat.findById(beatId).lean();
    if (!beat) throw new AppError("Beat not found", 404);
    if (String((beat as any).sellerId) !== String(req.user!.userId))
      throw new AppError("Only the beat owner can pin comments", 403);

    const comment = await Comment.findOne({ _id: commentId, beatId });
    if (!comment) throw new AppError("Comment not found", 404);

    comment.pinned = !comment.pinned;
    await comment.save();

    res.status(200).json({ success: true, data: { id: commentId, pinned: comment.pinned } });
  })
);

beatRouter.delete(
  "/:beatId/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { beatId, commentId } = req.params;

    const [comment, beat] = await Promise.all([
      Comment.findOne({ _id: commentId, beatId }),
      Beat.findById(beatId).lean(),
    ]);

    if (!comment) throw new AppError("Comment not found", 404);

    const isBeatOwner = beat && String((beat as any).sellerId) === String(req.user!.userId);
    const isCommentAuthor = String(comment.userId) === String(req.user!.userId);

    if (!isBeatOwner && !isCommentAuthor)
      throw new AppError("Not authorized to remove this comment", 403);

    await comment.deleteOne();

    res.status(200).json({ success: true, data: { id: commentId } });
  })
);

export default beatRouter;
