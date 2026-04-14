import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import LyricSong from "../../models/lyricSong.model";

const lyricsRouter = Router();

const createLyricSongSchema = z.object({
  title: z.string().trim().max(120).optional(),
  lyrics: z.string().max(200_000).optional(),
});

const updateLyricSongSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    lyrics: z.string().max(200_000).optional(),
  })
  .refine((value) => typeof value.title === "string" || typeof value.lyrics === "string", {
    message: "At least one of title or lyrics is required.",
  });

const parseBody = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    throw new AppError("Invalid request body.", 400, "VALIDATION_ERROR", err);
  }
};

const normalizeTitle = (title?: string) => (title ?? "").trim() || "Untitled";

lyricsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const songs = await LyricSong.find({ userId })
      .sort({ updatedAt: -1 })
      .select("title lyrics updatedAt createdAt")
      .limit(200);

    res.status(200).json({
      success: true,
      data: {
        songs: songs.map((song) => ({
          id: String(song._id),
          title: song.title,
          lyrics: song.lyrics,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
        })),
      },
    });
  })
);

lyricsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = parseBody(createLyricSongSchema, req.body);
    const userId = req.user!.userId;

    const song = await LyricSong.create({
      userId,
      title: normalizeTitle(parsed.title),
      lyrics: String(parsed.lyrics ?? ""),
    });

    res.status(201).json({
      success: true,
      message: "Lyric sheet created.",
      data: {
        song: {
          id: String(song._id),
          title: song.title,
          lyrics: song.lyrics,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
        },
      },
    });
  })
);

lyricsRouter.put(
  "/:songId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { songId } = req.params;
    const parsed = parseBody(updateLyricSongSchema, req.body);
    const userId = req.user!.userId;

    const update: Record<string, unknown> = {};
    if (typeof parsed.title === "string") update.title = normalizeTitle(parsed.title);
    if (typeof parsed.lyrics === "string") update.lyrics = parsed.lyrics;

    const song = await LyricSong.findOneAndUpdate(
      { _id: songId, userId },
      { $set: update },
      { new: true }
    ).select("title lyrics updatedAt createdAt");

    if (!song) {
      throw new AppError("Lyric sheet not found.", 404, "LYRICS_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Lyric sheet saved.",
      data: {
        song: {
          id: String(song._id),
          title: song.title,
          lyrics: song.lyrics,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
        },
      },
    });
  })
);

lyricsRouter.delete(
  "/:songId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { songId } = req.params;
    const userId = req.user!.userId;

    const deleted = await LyricSong.findOneAndDelete({ _id: songId, userId }).select("_id");
    if (!deleted) {
      throw new AppError("Lyric sheet not found.", 404, "LYRICS_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Lyric sheet deleted.",
      data: { id: songId },
    });
  })
);

export default lyricsRouter;

