import { Router } from "express";
import multer from "multer";
import { requireAuth, requireSeller } from "../../middlewares/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import cloudinary from "../../config/cloudinary.config";
import Beat from "../../models/beat.model";
import User from "../../models/user.model";
import { env } from "../../config/env.config";

const beatRouter = Router();

const STUDIO_HANDLE_REGEX = /^[a-z0-9._-]{3,30}$/;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  requireSeller,
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
    });

    await newBeat.save();

    res.status(201).json({
      success: true,
      data: newBeat,
    });
  })
);

beatRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const rawQuery = String(req.query?.q ?? "").trim();
    const limit = Math.min(Math.max(Number(req.query?.limit) || 6, 1), 20);

    if (rawQuery.length < 2) {
      res.status(200).json({
        success: true,
        data: {
          beats: [],
          producers: [],
        },
      });
      return;
    }

    const queryRegex = new RegExp(escapeRegex(rawQuery), "i");

    const [beats, producers] = await Promise.all([
      Beat.find({
        $or: [
          { title: queryRegex },
          { beatType: queryRegex },
          { genre: queryRegex },
          { tags: queryRegex },
        ],
      })
        .populate("sellerId", "displayName avatar studioProfile.handle")
        .select("title beatType genre tempo basicPrice artworkUrl sellerId")
        .sort({ plays: -1, createdAt: -1 })
        .limit(limit),
      User.find({
        $or: [
          { displayName: queryRegex },
          { "studioProfile.studioName": queryRegex },
          { "studioProfile.handle": queryRegex },
        ],
        "studioProfile.handle": { $exists: true, $ne: "" },
      })
        .select("displayName avatar studioProfile followers")
        .sort({ createdAt: -1 })
        .limit(limit),
    ]);

    const beatResults = beats.map((beat) => {
      const seller =
        beat.sellerId && typeof beat.sellerId === "object"
          ? (beat.sellerId as unknown as { displayName?: string; studioProfile?: { handle?: string } })
          : null;
      const producerHandle = String(seller?.studioProfile?.handle ?? "").trim();

      return {
        id: String(beat._id),
        title: beat.title,
        genre: beat.genre,
        tempo: beat.tempo,
        price: Number(beat.basicPrice ?? 0),
        artworkUrl: beat.artworkUrl,
        producerName: String(seller?.displayName ?? ""),
        producerHandle,
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

beatRouter.delete(
  "/:beatId",
  requireAuth,
  requireSeller,
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

export default beatRouter;
