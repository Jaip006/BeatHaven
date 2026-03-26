import { Router } from "express";
import multer from "multer";
import { requireAuth, requireSeller } from "../../middlewares/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import cloudinary from "../../config/cloudinary.config";
import Beat from "../../models/beat.model";

const beatRouter = Router();

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
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary error"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

beatRouter.post(
  "/",
  requireAuth,
  requireSeller,
  uploadFields,
  asyncHandler(async (req, res) => {
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
    const artworkUrl = await uploadBufferToCloudinary(files.artwork[0].buffer, "beats/artworks", "image");
    const untaggedMp3Url = await uploadBufferToCloudinary(files.untaggedMp3[0].buffer, "beats/mp3", "video");

    let untaggedWavUrl;
    if (files.untaggedWav?.[0]) {
      untaggedWavUrl = await uploadBufferToCloudinary(files.untaggedWav[0].buffer, "beats/wav", "video");
    }

    let stemsUrl;
    if (files.stems?.[0]) {
      stemsUrl = await uploadBufferToCloudinary(files.stems[0].buffer, "beats/stems", "auto");
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

      artworkUrl,
      untaggedMp3Url,
      untaggedWavUrl,
      stemsUrl,

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
  "/studio",
  requireAuth,
  requireSeller,
  asyncHandler(async (req, res) => {
    const beats = await Beat.find({ sellerId: req.user!.userId }).sort({ createdAt: -1 });

    // Dummy stats for now, later sum up real values
    const stats = {
      plays: beats.reduce((acc, b) => acc + (b.plays || 0), 0),
      totalBeats: beats.length,
      followers: 333,
      verified: true
    };

    res.status(200).json({
      success: true,
      data: {
        beats,
        stats
      },
    });
  })
);

export default beatRouter;
