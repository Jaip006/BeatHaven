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
  untaggedMp3Url: string;
  untaggedWavUrl: string;
  stemsUrl?: string;

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
    untaggedMp3Url: { type: String, required: true },
    untaggedWavUrl: { type: String, required: false },
    stemsUrl: { type: String, required: false },

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

    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Beat = mongoose.model<IBeat>("Beat", beatSchema);
export default Beat;
