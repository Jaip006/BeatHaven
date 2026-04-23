import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  beatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    beatId: { type: Schema.Types.ObjectId, ref: "Beat", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ beatId: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
