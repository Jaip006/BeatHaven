import mongoose, { Document, Schema } from "mongoose";

interface IMediaItem {
  url: string;
  type: "image" | "video" | "audio";
  publicId?: string;
}

export interface ICommunityPost extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  media: IMediaItem[];
  likes: mongoose.Types.ObjectId[];
  saves: mongoose.Types.ObjectId[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const mediaItemSchema = new Schema<IMediaItem>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "audio"], required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const communityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000, default: "" },
    media: { type: [mediaItemSchema], default: [] },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });

const CommunityPost = mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);
export default CommunityPost;
