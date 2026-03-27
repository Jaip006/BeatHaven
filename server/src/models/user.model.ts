import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "buyer" | "seller";

export interface IStudioProfileSocials {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  spotify?: string;
  soundcloud?: string;
  website?: string;
}

export interface IStudioProfile {
  studioName?: string;
  handle?: string;
  bio?: string;
  socials?: IStudioProfileSocials;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
  avatarPublicId?: string;
  mobileNumber?: string;
  gender?: "male" | "female" | "other" | "";
  dateOfBirth?: Date | null;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pin?: string;
  };
  payoutBank?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  mobileVerified: boolean;
  aadhaarVerified: boolean;
  followers: mongoose.Types.ObjectId[];
  isVerified: boolean;
  emailVerificationOtp?: string | null;
  emailVerificationOtpExpires?: Date | null;
  mobileVerificationPendingNumber?: string | null;
  mobileVerificationOtp?: string | null;
  mobileVerificationOtpExpires?: Date | null;
  refreshToken?: string;
  studioProfile?: IStudioProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
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
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    billingAddress: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pin: { type: String, trim: true, default: "" },
    },
    payoutBank: {
      accountName: { type: String, trim: true, default: "" },
      accountNumber: { type: String, trim: true, default: "" },
      ifscCode: { type: String, trim: true, uppercase: true, default: "" },
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
        type: Schema.Types.ObjectId,
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
    mobileVerificationPendingNumber: {
      type: String,
      default: null,
      trim: true,
      select: false,
    },
    mobileVerificationOtp: {
      type: String,
      default: null,
      select: false,
    },
    mobileVerificationOtpExpires: {
      type: Date,
      default: null,
      select: false,
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
  },
  {
    timestamps: true,
  }
);

// Enforce unique handle only when non-empty, and keep lookups fast.
userSchema.index(
  { "studioProfile.handle": 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { "studioProfile.handle": { $type: "string", $ne: "" } },
  }
);

// ─── Pre-save hook: hash password ─────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance method: compare password ────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
