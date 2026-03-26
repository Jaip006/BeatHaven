"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const beatSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
}, {
    timestamps: true,
});
beatSchema.index({ sellerId: 1 });
beatSchema.index({ createdAt: -1 });
beatSchema.index({ sellerId: 1, createdAt: -1 });
const Beat = mongoose_1.default.model("Beat", beatSchema);
exports.default = Beat;
