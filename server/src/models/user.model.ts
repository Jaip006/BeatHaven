import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "buyer" | "seller";

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  emailVerificationOtp?: string | null;
  emailVerificationOtpExpires?: Date | null;
  refreshToken?: string;
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
  },
  {
    timestamps: true,
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
