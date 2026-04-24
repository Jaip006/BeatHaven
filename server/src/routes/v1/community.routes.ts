import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { requireAuth } from "../../middlewares/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import cloudinary from "../../config/cloudinary.config";
import CommunityPost from "../../models/community-post.model";
import CommunityComment from "../../models/community-comment.model";

const communityRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: "auto" | "image" | "video" | "raw" = "auto"
): Promise<{ secureUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary error"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

const formatUser = (user: any) => ({
  id: String(user?._id ?? ""),
  displayName: String(user?.studioProfile?.studioName ?? user?.displayName ?? "Unknown"),
  avatar: String(user?.avatar ?? ""),
  handle: String(user?.studioProfile?.handle ?? ""),
});

// GET /community/feed
communityRouter.get(
  "/feed",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query?.limit) || 10, 1), 50);
    const skip = Math.max(Number(req.query?.skip) || 0, 0);
    const authorId = String(req.query?.authorId ?? "").trim();
    const savedBy = String(req.query?.savedBy ?? "").trim();

    const filter: Record<string, unknown> = {};
    if (authorId && mongoose.isValidObjectId(authorId)) {
      filter["userId"] = new mongoose.Types.ObjectId(authorId);
    }
    if (savedBy && mongoose.isValidObjectId(savedBy)) {
      filter["saves"] = { $in: [new mongoose.Types.ObjectId(savedBy)] };
    }

    const [posts, total] = await Promise.all([
      CommunityPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "displayName avatar studioProfile")
        .lean(),
      CommunityPost.countDocuments(filter),
    ]);

    const formatted = posts.map((post: any) => ({
      id: String(post._id),
      text: post.text ?? "",
      media: post.media ?? [],
      likesCount: post.likes?.length ?? 0,
      savesCount: post.saves?.length ?? 0,
      commentsCount: post.commentsCount ?? 0,
      likes: (post.likes ?? []).map(String),
      saves: (post.saves ?? []).map(String),
      createdAt: post.createdAt,
      user: formatUser(post.userId),
    }));

    res.json({ success: true, data: { posts: formatted, total, hasMore: skip + limit < total } });
  })
);

// POST /community — create post
communityRouter.post(
  "/",
  requireAuth,
  upload.array("media", 4),
  asyncHandler(async (req, res) => {
    const text = String(req.body?.text ?? "").trim();
    const files = (req.files ?? []) as Express.Multer.File[];

    if (!text && files.length === 0) {
      throw new AppError("Post must have text or media.", 400);
    }
    if (text.length > 2000) {
      throw new AppError("Post text cannot exceed 2000 characters.", 400);
    }

    const mediaItems: { url: string; type: "image" | "video" | "audio"; publicId: string }[] = [];

    for (const file of files) {
      const mime = file.mimetype;
      let type: "image" | "video" | "audio";
      let resourceType: "image" | "video" | "raw" = "auto" as any;

      if (mime.startsWith("image/")) {
        type = "image";
        resourceType = "image";
      } else if (mime.startsWith("video/")) {
        type = "video";
        resourceType = "video";
      } else if (mime.startsWith("audio/")) {
        type = "audio";
        resourceType = "video"; // Cloudinary stores audio under video resource type
      } else {
        continue;
      }

      const { secureUrl, publicId } = await uploadBufferToCloudinary(
        file.buffer,
        "community",
        resourceType
      );
      mediaItems.push({ url: secureUrl, type, publicId });
    }

    const post = await CommunityPost.create({
      userId: req.user!.userId,
      text,
      media: mediaItems,
    });

    await post.populate("userId", "displayName avatar studioProfile");
    const p = post as any;

    res.status(201).json({
      success: true,
      data: {
        id: String(p._id),
        text: p.text,
        media: p.media,
        likesCount: 0,
        savesCount: 0,
        commentsCount: 0,
        likes: [],
        saves: [],
        createdAt: p.createdAt,
        user: formatUser(p.userId),
      },
    });
  })
);

// POST /community/:postId/like — toggle like
communityRouter.post(
  "/:postId/like",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const post = await CommunityPost.findById(postId);
    if (!post) throw new AppError("Post not found", 404);

    const alreadyLiked = post.likes.some((id) => String(id) === String(userId));
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => String(id) !== String(userId)) as any;
    } else {
      post.likes.push(new mongoose.Types.ObjectId(userId) as any);
    }
    await post.save();

    res.json({ success: true, data: { liked: !alreadyLiked, likesCount: post.likes.length } });
  })
);

// POST /community/:postId/save — toggle save
communityRouter.post(
  "/:postId/save",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const post = await CommunityPost.findById(postId);
    if (!post) throw new AppError("Post not found", 404);

    const alreadySaved = post.saves.some((id) => String(id) === String(userId));
    if (alreadySaved) {
      post.saves = post.saves.filter((id) => String(id) !== String(userId)) as any;
    } else {
      post.saves.push(new mongoose.Types.ObjectId(userId) as any);
    }
    await post.save();

    res.json({ success: true, data: { saved: !alreadySaved, savesCount: post.saves.length } });
  })
);

// GET /community/:postId/comments
communityRouter.get(
  "/:postId/comments",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const limit = Math.min(Math.max(Number(req.query?.limit) || 20, 1), 100);
    const skip = Math.max(Number(req.query?.skip) || 0, 0);

    const [comments, total] = await Promise.all([
      CommunityComment.find({ postId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "displayName avatar studioProfile")
        .lean(),
      CommunityComment.countDocuments({ postId }),
    ]);

    const formatted = (comments as any[]).map((c) => ({
      id: String(c._id),
      text: c.text,
      createdAt: c.createdAt,
      user: formatUser(c.userId),
    }));

    res.json({ success: true, data: { comments: formatted, total } });
  })
);

// POST /community/:postId/comments
communityRouter.post(
  "/:postId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const text = String(req.body?.text ?? "").trim();

    if (!text) throw new AppError("Comment text is required.", 400);
    if (text.length > 1000) throw new AppError("Comment must be 1000 characters or less.", 400);

    const post = await CommunityPost.findById(postId);
    if (!post) throw new AppError("Post not found", 404);

    const comment = await CommunityComment.create({ postId, userId: req.user!.userId, text });
    await comment.populate("userId", "displayName avatar studioProfile");

    post.commentsCount = (post.commentsCount ?? 0) + 1;
    await post.save();

    const c = comment as any;
    res.status(201).json({
      success: true,
      data: {
        id: String(c._id),
        text: c.text,
        createdAt: c.createdAt,
        user: formatUser(c.userId),
      },
    });
  })
);

// DELETE /community/:postId
communityRouter.delete(
  "/:postId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await CommunityPost.findOne({ _id: postId, userId: req.user!.userId });
    if (!post) throw new AppError("Post not found or not authorized.", 404);

    await CommunityComment.deleteMany({ postId });
    await post.deleteOne();

    res.json({ success: true, data: { postId } });
  })
);

// DELETE /community/:postId/comments/:commentId
communityRouter.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId, commentId } = req.params;
    const [comment, post] = await Promise.all([
      CommunityComment.findOne({ _id: commentId, postId }),
      CommunityPost.findById(postId),
    ]);

    if (!comment) throw new AppError("Comment not found.", 404);

    const isAuthor = String(comment.userId) === String(req.user!.userId);
    const isPostOwner = post && String(post.userId) === String(req.user!.userId);
    if (!isAuthor && !isPostOwner) throw new AppError("Not authorized.", 403);

    await comment.deleteOne();
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount ?? 1) - 1);
      await post.save();
    }

    res.json({ success: true, data: { commentId } });
  })
);

export default communityRouter;
