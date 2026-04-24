import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

communityCommentSchema.index({ postId: 1, createdAt: -1 });

const CommunityComment = mongoose.model<ICommunityComment>("CommunityComment", communityCommentSchema);
export default CommunityComment;
