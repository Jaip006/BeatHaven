import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import User from "../../models/user.model";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import { sendPasswordResetOtpEmail, sendVerificationOtpEmail } from "../../utils/email.utils";
import { generateOtp, hashOtp } from "../../utils/otp.utils";
import { sendSms } from "../../utils/sms.utils";
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
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

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
const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});
const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
  newPassword: z.string().min(8),
});
const verifyResetOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const verificationSchema = z.object({
  mobileNumber: z.string().trim().max(20).optional(),
  mobileVerified: z.boolean().optional(),
  aadhaarVerified: z.boolean().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().trim().optional(),
  billingAddress: z
    .object({
      street: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      pin: z.string().trim().max(12).optional(),
    })
    .optional(),
  payoutBank: z
    .object({
      accountName: z.string().trim().max(100).optional(),
      accountNumber: z.string().trim().max(40).optional(),
      ifscCode: z.string().trim().max(20).optional(),
    })
    .optional(),
});

const sendMobileOtpSchema = z.object({
  mobileNumber: z.string().trim().min(10).max(20),
});

const verifyMobileOtpSchema = z.object({
  mobileNumber: z.string().trim().min(10).max(20),
  otp: z.string().trim().length(6),
});

const normalizeIndianMobileNumber = (rawNumber: string): string => {
  const sanitized = rawNumber.replace(/[^\d+]/g, "").trim();
  const digits = sanitized.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (sanitized.startsWith("+") && digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  throw new AppError("Please enter a valid Indian mobile number.", 400, "INVALID_MOBILE_NUMBER");
};

const parseDateOfBirth = (value?: string): Date | null | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new AppError("Date of birth must be in YYYY-MM-DD format.", 400, "INVALID_DATE_OF_BIRTH");
  }
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Invalid date of birth.", 400, "INVALID_DATE_OF_BIRTH");
  }
  const now = new Date();
  if (parsed.getTime() > now.getTime()) {
    throw new AppError("Date of birth cannot be in the future.", 400, "INVALID_DATE_OF_BIRTH");
  }
  return parsed;
};

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
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, a password reset OTP has been sent.",
      });
    }

    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email first, then try password reset.",
        400,
        "EMAIL_NOT_VERIFIED"
      );
    }

    const otp = generateOtp();
    user.emailVerificationOtp = hashOtp(otp);
    user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetOtpEmail({
      email: normalizedEmail,
      displayName: user.displayName,
      otp,
    });

    res.status(200).json({
      success: true,
      message: "If an account exists for this email, a password reset OTP has been sent.",
    });
  })
);

authRouter.post(
  "/verify-reset-otp",
  asyncHandler(async (req, res) => {
    const { email, otp } = verifyResetOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      throw new AppError("No account found for this email.", 404, "USER_NOT_FOUND");
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      throw new AppError("No reset OTP found. Please request a new code.", 400, "OTP_MISSING");
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      user.emailVerificationOtp = null;
      user.emailVerificationOtpExpires = null;
      await user.save();
      throw new AppError("OTP has expired. Please request a new code.", 400, "OTP_EXPIRED");
    }

    if (user.emailVerificationOtp !== hashOtp(otp)) {
      throw new AppError("Invalid OTP.", 400, "OTP_INVALID");
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now set a new password.",
    });
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +refreshToken +lastActivityAt +emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      throw new AppError("No account found for this email.", 404, "USER_NOT_FOUND");
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      throw new AppError("No reset OTP found. Please request a new code.", 400, "OTP_MISSING");
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      user.emailVerificationOtp = null;
      user.emailVerificationOtpExpires = null;
      await user.save();
      throw new AppError("OTP has expired. Please request a new code.", 400, "OTP_EXPIRED");
    }

    if (user.emailVerificationOtp !== hashOtp(otp)) {
      throw new AppError("Invalid OTP.", 400, "OTP_INVALID");
    }

    user.password = newPassword;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    user.refreshToken = undefined;
    user.lastActivityAt = null;
    await user.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can sign in with your new password.",
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
    user.lastActivityAt = new Date();
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
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          billingAddress: user.billingAddress ?? {},
          payoutBank: user.payoutBank ?? {},
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
    const user = await User.findById(payload.userId).select("+refreshToken +lastActivityAt");

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const lastActivityTime = user.lastActivityAt?.getTime();
    const isInactive =
      typeof lastActivityTime === "number" &&
      Date.now() - lastActivityTime > INACTIVITY_TIMEOUT_MS;

    if (isInactive) {
      user.refreshToken = undefined;
      user.lastActivityAt = null;
      await user.save();

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return res.status(401).json({
        success: false,
        message: "Session expired due to inactivity. Please sign in again.",
        error: {
          code: "SESSION_INACTIVE",
        },
      });
    }

    user.lastActivityAt = new Date();
    await user.save();

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
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          billingAddress: user.billingAddress ?? {},
          payoutBank: user.payoutBank ?? {},
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
        user.lastActivityAt = null;
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
  "/mobile/send-otp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = sendMobileOtpSchema.parse(req.body);
    const normalizedMobileNumber = normalizeIndianMobileNumber(parsed.mobileNumber);

    const user = await User.findById(req.user!.userId).select(
      "+mobileVerificationPendingNumber +mobileVerificationOtp +mobileVerificationOtpExpires"
    );

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.mobileVerificationPendingNumber = normalizedMobileNumber;
    user.mobileVerificationOtp = otpHash;
    user.mobileVerificationOtpExpires = otpExpiresAt;

    if (user.mobileNumber !== normalizedMobileNumber) {
      user.mobileVerified = false;
    }

    await user.save();

    await sendSms({
      to: normalizedMobileNumber,
      body: `Your BeatHaven OTP is ${otp}. It expires in 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number.",
      data: {
        mobileNumber: normalizedMobileNumber,
      },
    });
  })
);

authRouter.post(
  "/mobile/verify-otp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = verifyMobileOtpSchema.parse(req.body);
    const normalizedMobileNumber = normalizeIndianMobileNumber(parsed.mobileNumber);

    const user = await User.findById(req.user!.userId).select(
      "+mobileVerificationPendingNumber +mobileVerificationOtp +mobileVerificationOtpExpires"
    );
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (
      !user.mobileVerificationPendingNumber ||
      !user.mobileVerificationOtp ||
      !user.mobileVerificationOtpExpires
    ) {
      throw new AppError("No OTP request found. Please request a new OTP.", 400, "OTP_MISSING");
    }

    if (user.mobileVerificationPendingNumber !== normalizedMobileNumber) {
      throw new AppError("Mobile number mismatch. Please request OTP again.", 400, "MOBILE_NUMBER_MISMATCH");
    }

    if (user.mobileVerificationOtpExpires.getTime() < Date.now()) {
      user.mobileVerificationPendingNumber = null;
      user.mobileVerificationOtp = null;
      user.mobileVerificationOtpExpires = null;
      await user.save();
      throw new AppError("OTP has expired. Please request a new OTP.", 400, "OTP_EXPIRED");
    }

    if (user.mobileVerificationOtp !== hashOtp(parsed.otp)) {
      throw new AppError("Invalid OTP. Please try again.", 400, "OTP_INVALID");
    }

    user.mobileNumber = user.mobileVerificationPendingNumber;
    user.mobileVerified = true;
    user.mobileVerificationPendingNumber = null;
    user.mobileVerificationOtp = null;
    user.mobileVerificationOtpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mobile number verified successfully.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          mobileNumber: user.mobileNumber,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          billingAddress: user.billingAddress ?? {},
          payoutBank: user.payoutBank ?? {},
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
  "/verification",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = verificationSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (typeof parsed.mobileNumber === "string" || typeof parsed.mobileVerified === "boolean") {
      throw new AppError(
        "Mobile verification must be completed via OTP endpoints.",
        400,
        "MOBILE_OTP_REQUIRED"
      );
    }
    if (typeof parsed.aadhaarVerified === "boolean") {
      user.aadhaarVerified = parsed.aadhaarVerified;
    }
    if (typeof parsed.gender === "string") {
      user.gender = parsed.gender;
    }
    const parsedDateOfBirth = parseDateOfBirth(parsed.dateOfBirth);
    if (parsedDateOfBirth !== undefined) {
      user.dateOfBirth = parsedDateOfBirth;
    }
    if (parsed.billingAddress) {
      user.billingAddress = {
        ...(user.billingAddress ?? {}),
        street: parsed.billingAddress.street ?? user.billingAddress?.street ?? "",
        city: parsed.billingAddress.city ?? user.billingAddress?.city ?? "",
        state: parsed.billingAddress.state ?? user.billingAddress?.state ?? "",
        pin: parsed.billingAddress.pin ?? user.billingAddress?.pin ?? "",
      };
    }
    if (parsed.payoutBank) {
      user.payoutBank = {
        ...(user.payoutBank ?? {}),
        accountName: parsed.payoutBank.accountName ?? user.payoutBank?.accountName ?? "",
        accountNumber: parsed.payoutBank.accountNumber ?? user.payoutBank?.accountNumber ?? "",
        ifscCode: (parsed.payoutBank.ifscCode ?? user.payoutBank?.ifscCode ?? "").toUpperCase(),
      };
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
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          billingAddress: user.billingAddress ?? {},
          payoutBank: user.payoutBank ?? {},
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
