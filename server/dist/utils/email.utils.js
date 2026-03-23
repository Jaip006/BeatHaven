"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationOtpEmail = sendVerificationOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_config_1 = require("../config/env.config");
const appError_1 = __importDefault(require("./appError"));
function buildTransporter() {
    if (!env_config_1.env.EMAIL_HOST || !env_config_1.env.EMAIL_PORT || !env_config_1.env.EMAIL_USER || !env_config_1.env.EMAIL_PASS) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: env_config_1.env.EMAIL_HOST,
        port: env_config_1.env.EMAIL_PORT,
        secure: env_config_1.env.EMAIL_PORT === 465,
        auth: {
            user: env_config_1.env.EMAIL_USER,
            pass: env_config_1.env.EMAIL_PASS,
        },
    });
}
function isAuthenticationError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    const smtpError = error;
    return (smtpError.code === "EAUTH" ||
        smtpError.responseCode === 535 ||
        smtpError.message?.toLowerCase().includes("authentication failed") === true);
}
async function sendVerificationOtpEmail({ email, displayName, otp, }) {
    const transporter = buildTransporter();
    if (!transporter || !env_config_1.env.EMAIL_FROM) {
        if (env_config_1.env.NODE_ENV === "development") {
            console.log(`[DEV OTP] ${email}: ${otp}`);
            return;
        }
        throw new appError_1.default("Email service is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.", 500, "EMAIL_NOT_CONFIGURED");
    }
    try {
        await transporter.sendMail({
            from: env_config_1.env.EMAIL_FROM,
            to: email,
            subject: "Your BeatHaven verification code",
            html: `
        <div style="font-family: Arial, sans-serif; background: #0b0b0b; color: #ffffff; padding: 24px;">
          <h2 style="margin: 0 0 16px;">Verify your BeatHaven account</h2>
          <p style="margin: 0 0 12px;">Hi ${displayName},</p>
          <p style="margin: 0 0 20px;">Use the OTP below to verify your email address.</p>
          <div style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #121212; border: 1px solid #262626; font-size: 28px; letter-spacing: 8px; font-weight: 700;">
            ${otp}
          </div>
          <p style="margin: 20px 0 0; color: #b3b3b3;">This code expires in 10 minutes.</p>
        </div>
      `,
        });
    }
    catch (error) {
        if (env_config_1.env.NODE_ENV === "development") {
            console.warn(`[DEV OTP FALLBACK] Email delivery failed for ${email}. Using console OTP instead.`);
            console.warn(error);
            console.log(`[DEV OTP] ${email}: ${otp}`);
            return;
        }
        const message = isAuthenticationError(error)
            ? "Failed to send verification email. SMTP authentication failed. Check EMAIL_USER, EMAIL_PASS, and the provider's app-password requirements."
            : "Failed to send verification email";
        throw new appError_1.default(message, 502, "EMAIL_SEND_FAILED", error instanceof Error ? error.message : error);
    }
}
