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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false, // Not returned by default
    },
    role: {
        type: String,
        enum: ["buyer", "seller"],
        default: "buyer",
        required: true,
    },
    displayName: {
        type: String,
        required: [true, "Display name is required"],
        trim: true,
        maxlength: [50, "Display name cannot exceed 50 characters"],
    },
    avatar: {
        type: String,
        default: null,
    },
    avatarPublicId: {
        type: String,
        default: null,
    },
    mobileNumber: {
        type: String,
        default: "",
        trim: true,
    },
    mobileVerified: {
        type: Boolean,
        default: false,
    },
    aadhaarVerified: {
        type: Boolean,
        default: false,
    },
    followers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationOtp: {
        type: String,
        select: false,
        default: null,
    },
    emailVerificationOtpExpires: {
        type: Date,
        default: null,
    },
    refreshToken: {
        type: String,
        select: false, // Not returned by default
    },
    studioProfile: {
        studioName: { type: String, trim: true, maxlength: 60, default: "" },
        handle: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 30,
            default: "",
            match: [/^[a-z0-9._-]{3,30}$|^$/, "Invalid studio handle format"],
        },
        bio: { type: String, trim: true, maxlength: 280, default: "" },
        socials: {
            instagram: { type: String, trim: true, default: "" },
            youtube: { type: String, trim: true, default: "" },
            twitter: { type: String, trim: true, default: "" },
            spotify: { type: String, trim: true, default: "" },
            soundcloud: { type: String, trim: true, default: "" },
            website: { type: String, trim: true, default: "" },
        },
    },
}, {
    timestamps: true,
});
// Enforce unique handle only when non-empty, and keep lookups fast.
userSchema.index({ "studioProfile.handle": 1 }, {
    unique: true,
    sparse: true,
    partialFilterExpression: { "studioProfile.handle": { $type: "string", $ne: "" } },
});
// ─── Pre-save hook: hash password ─────────────────────────
userSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// ─── Instance method: compare password ────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
