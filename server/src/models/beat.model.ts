import mongoose, { Document, Schema } from "mongoose";

export interface IBeat extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  beatType: string;
  genre: string;
  instruments: string[];
  tempo: number;
  musicalKey: string;
  moods: string[];
  tags: string[];
  
  // Sample Info
  isSampleUsed: boolean;
  sampleDetails: Array<{
    isRoyaltyFree: boolean;
    ownerName: string;
    sourceLink: string;
  }>;

  // Media
  artworkUrl: string;
  artworkPublicId?: string;
  untaggedMp3Url: string;
  untaggedMp3PublicId?: string;
  untaggedWavUrl: string;
  untaggedWavPublicId?: string;
  stemsUrl?: string;
  stemsPublicId?: string;

  // Non-Exclusive Licensing
  freeMp3Enabled: boolean;
  wavEnabled: boolean;
  basicPrice?: number;
  wavStemsEnabled: boolean;
  premiumPrice?: number;
  publishingRights?: string;
  masterRecordings?: string;
  licensePeriod?: string;

  // Exclusive Licensing
  exclusiveEnabled: boolean;
  exclusivePrice?: number;
  exclusiveNegotiable: boolean;
  exclusivePublishingRights?: string;

  // Audio fingerprint for duplicate detection
  audioFingerprint?: number[];
  audioDuration?: number;

  // Stats
  plays: number;
  likes: number;

  createdAt: Date;
  updatedAt: Date;
}

const beatSchema = new Schema<IBeat>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    beatType: { type: String, required: true },
    genre: { type: String, required: true },
    instruments: [{ type: String }],
    tempo: { type: Number, required: true },
    musicalKey: { type: String, required: true },
    moods: [{ type: String }],
    tags: [{ type: String }],

    isSampleUsed: { type: Boolean, default: false },
    sampleDetails: [
      {
        isRoyaltyFree: { type: Boolean },
        ownerName: { type: String },
        sourceLink: { type: String },
      },
    ],

    artworkUrl: { type: String, required: true },
    artworkPublicId: { type: String, required: false },
    untaggedMp3Url: { type: String, required: true },
    untaggedMp3PublicId: { type: String, required: false },
    untaggedWavUrl: { type: String, required: false },
    untaggedWavPublicId: { type: String, required: false },
    stemsUrl: { type: String, required: false },
    stemsPublicId: { type: String, required: false },

    freeMp3Enabled: { type: Boolean, default: false },
    wavEnabled: { type: Boolean, default: false },
    basicPrice: { type: Number },
    wavStemsEnabled: { type: Boolean, default: false },
    premiumPrice: { type: Number },
    publishingRights: { type: String },
    masterRecordings: { type: String },
    licensePeriod: { type: String },

    exclusiveEnabled: { type: Boolean, default: false },
    exclusivePrice: { type: Number },
    exclusiveNegotiable: { type: Boolean, default: false },
    exclusivePublishingRights: { type: String },

    audioFingerprint: { type: [Number], required: false },
    audioDuration: { type: Number, required: false },

    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

beatSchema.index({ sellerId: 1 });
beatSchema.index({ createdAt: -1 });
beatSchema.index({ sellerId: 1, createdAt: -1 });

const Beat = mongoose.model<IBeat>("Beat", beatSchema);
export default Beat;
