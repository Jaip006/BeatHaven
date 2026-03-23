import nodemailer from "nodemailer";
import { env } from "../config/env.config";
import AppError from "./appError";

interface SendVerificationOtpEmailOptions {
  email: string;
  displayName: string;
  otp: string;
}

function buildTransporter() {
  if (!env.EMAIL_HOST || !env.EMAIL_PORT || !env.EMAIL_USER || !env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

function isAuthenticationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const smtpError = error as { code?: string; responseCode?: number; message?: string };

  return (
    smtpError.code === "EAUTH" ||
    smtpError.responseCode === 535 ||
    smtpError.message?.toLowerCase().includes("authentication failed") === true
  );
}

export async function sendVerificationOtpEmail({
  email,
  displayName,
  otp,
}: SendVerificationOtpEmailOptions): Promise<void> {
  const transporter = buildTransporter();

  if (!transporter || !env.EMAIL_FROM) {
    if (env.NODE_ENV === "development") {
      console.log(`[DEV OTP] ${email}: ${otp}`);
      return;
    }

    throw new AppError(
      "Email service is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
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
  } catch (error) {
    if (env.NODE_ENV === "development") {
      console.warn(
        `[DEV OTP FALLBACK] Email delivery failed for ${email}. Using console OTP instead.`
      );
      console.warn(error);
      console.log(`[DEV OTP] ${email}: ${otp}`);
      return;
    }

    const message = isAuthenticationError(error)
      ? "Failed to send verification email. SMTP authentication failed. Check EMAIL_USER, EMAIL_PASS, and the provider's app-password requirements."
      : "Failed to send verification email";

    throw new AppError(
      message,
      502,
      "EMAIL_SEND_FAILED",
      error instanceof Error ? error.message : error
    );
  }
}
