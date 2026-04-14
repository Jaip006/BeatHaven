import mongoose, { Document, Schema } from "mongoose";

export interface ILyricSong extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  lyrics: string;
  createdAt: Date;
  updatedAt: Date;
}

const lyricSongSchema = new Schema<ILyricSong>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    lyrics: { type: String, default: "", maxlength: 200_000 },
  },
  { timestamps: true }
);

lyricSongSchema.index({ userId: 1, updatedAt: -1 });

const LyricSong = mongoose.model<ILyricSong>("LyricSong", lyricSongSchema);
export default LyricSong;

