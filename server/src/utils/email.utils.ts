import nodemailer from "nodemailer";
import { env } from "../config/env.config";
import AppError from "./appError";

interface SendVerificationOtpEmailOptions {
  email: string;
  displayName: string;
  otp: string;
}
interface SendPasswordResetOtpEmailOptions {
  email: string;
  displayName: string;
  otp: string;
}
type EmailHealthStatus = {
  configured: boolean;
  fromConfigured: boolean;
  connectionVerified: boolean | null;
  reason: string | null;
  attempts?: string[];
  diagnostics?: {
    code: string | null;
    responseCode: number | null;
    command: string | null;
    message: string | null;
  };
};

type SmtpTarget = {
  host: string;
  port: number;
  secure: boolean;
};

const buildTransporter = (target: SmtpTarget) =>
  nodemailer.createTransport({
    host: target.host,
    port: target.port,
    secure: target.secure,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 8_000,
  });

function getSmtpTargets(): SmtpTarget[] {
  if (!env.EMAIL_HOST || !env.EMAIL_PORT || !env.EMAIL_USER || !env.EMAIL_PASS) {
    return [];
  }

  const targets: SmtpTarget[] = [
    {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
    },
  ];

  const host = env.EMAIL_HOST.toLowerCase();
  if (host === "smtp.gmail.com") {
    if (env.EMAIL_PORT === 587) {
      targets.push({ host: env.EMAIL_HOST, port: 465, secure: true });
    } else if (env.EMAIL_PORT === 465) {
      targets.push({ host: env.EMAIL_HOST, port: 587, secure: false });
    }
  }

  const fallbackPorts = String(env.EMAIL_PORT_FALLBACKS ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  fallbackPorts.forEach((port) => {
    targets.push({
      host: env.EMAIL_HOST!,
      port,
      secure: port === 465,
    });
  });

  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.host}:${target.port}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

function getSmtpDiagnostics(error: unknown): {
  code: string | null;
  responseCode: number | null;
  command: string | null;
  message: string | null;
} {
  if (!error || typeof error !== "object") {
    return {
      code: null,
      responseCode: null,
      command: null,
      message: null,
    };
  }

  const smtpError = error as {
    code?: string;
    responseCode?: number;
    command?: string;
    message?: string;
  };

  return {
    code: smtpError.code ?? null,
    responseCode: typeof smtpError.responseCode === "number" ? smtpError.responseCode : null,
    command: smtpError.command ?? null,
    message: smtpError.message ?? null,
  };
}

async function sendOtpEmail({
  email,
  subject,
  title,
  intro,
  otp,
  signatureName,
}: {
  email: string;
  subject: string;
  title: string;
  intro: string;
  otp: string;
  signatureName: string;
}): Promise<void> {
  const smtpTargets = getSmtpTargets();

  if (smtpTargets.length === 0 || !env.EMAIL_FROM) {
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

  let lastError: unknown;
  const attempts: string[] = [];

  for (const target of smtpTargets) {
    attempts.push(`${target.host}:${target.port}`);
    const transporter = buildTransporter(target);


    console.log("Trying SMTP:", target.host, target.port);
    await transporter.verify();
    console.log("SMTP connected");

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject,
        html: `
        <div style="font-family: Arial, sans-serif; background: #0b0b0b; color: #ffffff; padding: 24px;">
          <h2 style="margin: 0 0 16px;">${title}</h2>
          <p style="margin: 0 0 20px;">${intro}</p>
          <div style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #121212; border: 1px solid #262626; font-size: 28px; letter-spacing: 8px; font-weight: 700;">
            ${otp}
          </div>
          <p style="margin: 20px 0 0; color: #b3b3b3;">This code expires in 10 minutes.</p>
          <p style="margin: 8px 0 0; color: #b3b3b3;">If you did not request this, you can safely ignore this email.</p>
          <p style="margin: 16px 0 0; color: #b3b3b3;">- ${signatureName}</p>
        </div>
      `,
      });
      return;
    } catch (error) {
      lastError = error;
      const diagnostics = getSmtpDiagnostics(error);
      const isTimeout = diagnostics.code === "ETIMEDOUT";
      if (!isTimeout) {
        break;
      }
    }
  }

  if (env.NODE_ENV === "development") {
    console.warn(
      `[DEV OTP FALLBACK] Email delivery failed for ${email}. Using console OTP instead.`
    );
    console.warn(lastError);
    console.log(`[DEV OTP] ${email}: ${otp}`);
    return;
  }

  const message = isAuthenticationError(lastError)
      ? "Failed to send verification email. SMTP authentication failed. Check EMAIL_USER, EMAIL_PASS, and the provider's app-password requirements."
      : "Failed to send verification email";

  throw new AppError(message, 502, "EMAIL_SEND_FAILED", {
    ...getSmtpDiagnostics(lastError),
    attempts,
  });
}

export async function getEmailServiceHealth(verifyConnection = false): Promise<EmailHealthStatus> {
  const smtpTargets = getSmtpTargets();
  const fromConfigured = Boolean(env.EMAIL_FROM);

  if (smtpTargets.length === 0) {
    return {
      configured: false,
      fromConfigured,
      connectionVerified: null,
      reason: "SMTP_TRANSPORT_NOT_CONFIGURED",
    };
  }

  if (!fromConfigured) {
    return {
      configured: true,
      fromConfigured: false,
      connectionVerified: null,
      reason: "EMAIL_FROM_MISSING",
    };
  }

  if (!verifyConnection) {
    return {
      configured: true,
      fromConfigured: true,
      connectionVerified: null,
      reason: null,
      attempts: smtpTargets.map((target) => `${target.host}:${target.port}`),
    };
  }

  let lastError: unknown;
  const attempts: string[] = [];

  for (const target of smtpTargets) {
    attempts.push(`${target.host}:${target.port}`);
    const transporter = buildTransporter(target);

    try {
      await transporter.verify();
      return {
        configured: true,
        fromConfigured: true,
        connectionVerified: true,
        reason: null,
        attempts,
      };
    } catch (error) {
      lastError = error;
      const diagnostics = getSmtpDiagnostics(error);
      const isTimeout = diagnostics.code === "ETIMEDOUT";
      if (!isTimeout) {
        break;
      }
    }
  }

  return {
    configured: true,
    fromConfigured: true,
    connectionVerified: false,
    reason: isAuthenticationError(lastError) ? "SMTP_AUTH_FAILED" : "SMTP_VERIFY_FAILED",
    attempts,
    diagnostics: getSmtpDiagnostics(lastError),
  };
}

export async function sendVerificationOtpEmail({
  email,
  displayName,
  otp,
}: SendVerificationOtpEmailOptions): Promise<void> {
  await sendOtpEmail({
    email,
    subject: "Your BeatHaven verification code",
    title: "Verify your BeatHaven account",
    intro: `Hi ${displayName}, use the OTP below to verify your email address.`,
    otp,
    signatureName: "Team BeatHaven",
  });
}

export async function sendPasswordResetOtpEmail({
  email,
  displayName,
  otp,
}: SendPasswordResetOtpEmailOptions): Promise<void> {
  await sendOtpEmail({
    email,
    subject: "Your BeatHaven password reset code",
    title: "Reset your BeatHaven password",
    intro: `Hi ${displayName}, use this OTP to reset your password.`,
    otp,
    signatureName: "Team BeatHaven",
  });
}
