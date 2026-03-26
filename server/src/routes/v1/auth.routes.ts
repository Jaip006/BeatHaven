import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import User from "../../models/user.model";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import { sendVerificationOtpEmail } from "../../utils/email.utils";
import { generateOtp, hashOtp } from "../../utils/otp.utils";
import cloudinary from "../../config/cloudinary.config";
import { requireAuth } from "../../middlewares/auth.middleware";
import { env } from "../../config/env.config";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";

const authRouter = Router();
const avatarUpload = multer({ storage: multer.memoryStorage() });

const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["buyer", "seller"]).optional(),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
});

const resendOtpSchema = z.object({
  email: z.string().trim().email(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const verificationSchema = z.object({
  mobileNumber: z.string().trim().max(20).optional(),
  mobileVerified: z.boolean().optional(),
  aadhaarVerified: z.boolean().optional(),
});

const ensureCloudinaryConfigured = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(
      "Cloudinary is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.",
      500,
      "CLOUDINARY_NOT_CONFIGURED"
    );
  }
};

const derivePublicIdFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const uploadSegment = "/upload/";
    const uploadIndex = parsed.pathname.indexOf(uploadSegment);
    if (uploadIndex === -1) return null;
    const afterUpload = parsed.pathname.slice(uploadIndex + uploadSegment.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExtension || null;
  } catch {
    return null;
  }
};

const uploadAvatarToCloudinary = (buffer: Buffer): Promise<{ secureUrl: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "users/avatars", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary error"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { displayName, email, password, role } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (existingUser?.isVerified) {
      throw new AppError("An account with this email already exists", 409, "EMAIL_IN_USE");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = existingUser;

    if (!user) {
      user = new User({
        displayName,
        email: normalizedEmail,
        password,
        role: role ?? "buyer",
        isVerified: false,
        emailVerificationOtp: otpHash,
        emailVerificationOtpExpires: otpExpiry,
      });
    } else {
      user.displayName = displayName;
      user.password = password;
      user.role = role ?? user.role;
      user.isVerified = false;
      user.emailVerificationOtp = otpHash;
      user.emailVerificationOtpExpires = otpExpiry;
    }

    await user.save();
    await sendVerificationOtpEmail({
      email: normalizedEmail,
      displayName: user.displayName,
      otp,
    });

    res.status(201).json({
      success: true,
      message: "Account created. Please verify the OTP sent to your email.",
      data: {
        email: normalizedEmail,
        requiresEmailVerification: true,
      },
    });
  })
);

authRouter.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { email, otp } = verifyEmailSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      throw new AppError("No account found for this email", 404, "USER_NOT_FOUND");
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      throw new AppError("No verification OTP found. Please request a new one.", 400, "OTP_MISSING");
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      throw new AppError("OTP has expired. Please request a new one.", 400, "OTP_EXPIRED");
    }

    if (user.emailVerificationOtp !== hashOtp(otp)) {
      throw new AppError("Invalid OTP", 400, "OTP_INVALID");
    }

    user.isVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can sign in now.",
    });
  })
);

authRouter.post(
  "/resend-otp",
  asyncHandler(async (req, res) => {
    const { email } = resendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      throw new AppError("No account found for this email", 404, "USER_NOT_FOUND");
    }

    if (user.isVerified) {
      throw new AppError("This email is already verified", 400, "EMAIL_ALREADY_VERIFIED");
    }

    const otp = generateOtp();
    user.emailVerificationOtp = hashOtp(otp);
    user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationOtpEmail({
      email: normalizedEmail,
      displayName: user.displayName,
      otp,
    });

    res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +refreshToken"
    );

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email with the OTP before signing in.",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          aadhaarVerified: user.aadhaarVerified,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token is missing", 401, "REFRESH_TOKEN_MISSING");
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          aadhaarVerified: user.aadhaarVerified,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken }).select("+refreshToken");

      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

authRouter.get("/me", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.put(
  "/verification",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = verificationSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (typeof parsed.mobileNumber === "string") {
      user.mobileNumber = parsed.mobileNumber;
    }
    if (typeof parsed.mobileVerified === "boolean") {
      user.mobileVerified = parsed.mobileVerified;
    }
    if (typeof parsed.aadhaarVerified === "boolean") {
      user.aadhaarVerified = parsed.aadhaarVerified;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Verification details updated.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          aadhaarVerified: user.aadhaarVerified,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  })
);

authRouter.put(
  "/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  asyncHandler(async (req, res) => {
    ensureCloudinaryConfigured();

    const file = req.file;
    if (!file) {
      throw new AppError("Avatar image is required.", 400);
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const oldAvatarPublicId = user.avatarPublicId || derivePublicIdFromUrl(user.avatar);
    if (oldAvatarPublicId) {
      try {
        await cloudinary.uploader.destroy(oldAvatarPublicId, { resource_type: "image", invalidate: true });
      } catch (error) {
        console.error("Failed to delete old avatar from Cloudinary:", oldAvatarPublicId, error);
      }
    }

    const uploadedAvatar = await uploadAvatarToCloudinary(file.buffer);
    user.avatar = uploadedAvatar.secureUrl;
    user.avatarPublicId = uploadedAvatar.publicId;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      data: {
        avatar: user.avatar,
      },
    });
  })
);

export default authRouter;
