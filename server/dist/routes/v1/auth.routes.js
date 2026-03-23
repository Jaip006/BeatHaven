"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const user_model_1 = __importDefault(require("../../models/user.model"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const appError_1 = __importDefault(require("../../utils/appError"));
const email_utils_1 = require("../../utils/email.utils");
const otp_utils_1 = require("../../utils/otp.utils");
const jwt_utils_1 = require("../../utils/jwt.utils");
const authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().min(2).max(50),
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(["buyer", "seller"]).optional(),
});
const verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    otp: zod_1.z.string().trim().length(6),
});
const resendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().min(8),
});
authRouter.post("/register", (0, asyncHandler_1.default)(async (req, res) => {
    const { displayName, email, password, role } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const existingUser = await user_model_1.default.findOne({ email: normalizedEmail }).select("+emailVerificationOtp +emailVerificationOtpExpires");
    if (existingUser?.isVerified) {
        throw new appError_1.default("An account with this email already exists", 409, "EMAIL_IN_USE");
    }
    const otp = (0, otp_utils_1.generateOtp)();
    const otpHash = (0, otp_utils_1.hashOtp)(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    let user = existingUser;
    if (!user) {
        user = new user_model_1.default({
            displayName,
            email: normalizedEmail,
            password,
            role: role ?? "buyer",
            isVerified: false,
            emailVerificationOtp: otpHash,
            emailVerificationOtpExpires: otpExpiry,
        });
    }
    else {
        user.displayName = displayName;
        user.password = password;
        user.role = role ?? user.role;
        user.isVerified = false;
        user.emailVerificationOtp = otpHash;
        user.emailVerificationOtpExpires = otpExpiry;
    }
    await user.save();
    await (0, email_utils_1.sendVerificationOtpEmail)({
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
}));
authRouter.post("/verify-email", (0, asyncHandler_1.default)(async (req, res) => {
    const { email, otp } = verifyEmailSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = await user_model_1.default.findOne({ email: normalizedEmail }).select("+emailVerificationOtp +emailVerificationOtpExpires");
    if (!user) {
        throw new appError_1.default("No account found for this email", 404, "USER_NOT_FOUND");
    }
    if (user.isVerified) {
        return res.status(200).json({
            success: true,
            message: "Email is already verified",
        });
    }
    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
        throw new appError_1.default("No verification OTP found. Please request a new one.", 400, "OTP_MISSING");
    }
    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
        throw new appError_1.default("OTP has expired. Please request a new one.", 400, "OTP_EXPIRED");
    }
    if (user.emailVerificationOtp !== (0, otp_utils_1.hashOtp)(otp)) {
        throw new appError_1.default("Invalid OTP", 400, "OTP_INVALID");
    }
    user.isVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Email verified successfully. You can sign in now.",
    });
}));
authRouter.post("/resend-otp", (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = resendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = await user_model_1.default.findOne({ email: normalizedEmail }).select("+emailVerificationOtp +emailVerificationOtpExpires");
    if (!user) {
        throw new appError_1.default("No account found for this email", 404, "USER_NOT_FOUND");
    }
    if (user.isVerified) {
        throw new appError_1.default("This email is already verified", 400, "EMAIL_ALREADY_VERIFIED");
    }
    const otp = (0, otp_utils_1.generateOtp)();
    user.emailVerificationOtp = (0, otp_utils_1.hashOtp)(otp);
    user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await (0, email_utils_1.sendVerificationOtpEmail)({
        email: normalizedEmail,
        displayName: user.displayName,
        otp,
    });
    res.status(200).json({
        success: true,
        message: "A new OTP has been sent to your email.",
    });
}));
authRouter.post("/login", (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = await user_model_1.default.findOne({ email: normalizedEmail }).select("+password +refreshToken");
    if (!user) {
        throw new appError_1.default("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new appError_1.default("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!user.isVerified) {
        throw new appError_1.default("Please verify your email with the OTP before signing in.", 403, "EMAIL_NOT_VERIFIED");
    }
    const accessToken = (0, jwt_utils_1.signAccessToken)({
        userId: user.id,
        role: user.role,
    });
    const refreshToken = (0, jwt_utils_1.signRefreshToken)({
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
                role: user.role,
                isVerified: user.isVerified,
            },
        },
    });
}));
authRouter.post("/refresh", (0, asyncHandler_1.default)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new appError_1.default("Refresh token is missing", 401, "REFRESH_TOKEN_MISSING");
    }
    const payload = (0, jwt_utils_1.verifyRefreshToken)(refreshToken);
    const user = await user_model_1.default.findById(payload.userId).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
        throw new appError_1.default("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }
    const accessToken = (0, jwt_utils_1.signAccessToken)({
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
                role: user.role,
                isVerified: user.isVerified,
            },
        },
    });
}));
authRouter.post("/logout", (0, asyncHandler_1.default)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        const user = await user_model_1.default.findOne({ refreshToken }).select("+refreshToken");
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
}));
authRouter.get("/me", (_req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
});
exports.default = authRouter;
