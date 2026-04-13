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
  provider: "smtp" | "brevo";
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

type OtpEmailPayload = {
  email: string;
  subject: string;
  title: string;
  intro: string;
  otp: string;
  signatureName: string;
};

type EmailProvider = {
  name: "smtp" | "brevo";
  isConfigured: () => boolean;
  sendOtpEmail: (payload: OtpEmailPayload) => Promise<void>;
  getHealth: (verifyConnection: boolean) => Promise<EmailHealthStatus>;
};

function parseSender(from: string): { email: string; name?: string } {
  const trimmed = from.trim();
  const withDisplayName = trimmed.match(/^(.*)<\s*([^<>@\s]+@[^<>@\s]+)\s*>$/);

  if (withDisplayName) {
    const name = withDisplayName[1].trim().replace(/^"|"$/g, "");
    const email = withDisplayName[2].trim();
    return name ? { email, name } : { email };
  }

  return { email: trimmed };
}

function buildOtpHtml({
  title,
  intro,
  otp,
  signatureName,
}: Pick<OtpEmailPayload, "title" | "intro" | "otp" | "signatureName">): string {
  return `
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
  `;
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

  const providerError = error as {
    code?: string;
    responseCode?: number;
    command?: string;
    message?: string;
  };

  return {
    code: providerError.code ?? null,
    responseCode: typeof providerError.responseCode === "number" ? providerError.responseCode : null,
    command: providerError.command ?? null,
    message: providerError.message ?? null,
  };
}

function isAuthenticationError(error: unknown): boolean {
  const diagnostics = getSmtpDiagnostics(error);

  return (
    diagnostics.code === "EAUTH" ||
    diagnostics.responseCode === 535 ||
    diagnostics.message?.toLowerCase().includes("authentication failed") === true
  );
}

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

function buildTransporter(target: SmtpTarget) {
  return nodemailer.createTransport({
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
}

function createSmtpProvider(): EmailProvider {
  return {
    name: "smtp",
    isConfigured: () =>
      Boolean(env.EMAIL_HOST && env.EMAIL_PORT && env.EMAIL_USER && env.EMAIL_PASS && env.EMAIL_FROM),
    async sendOtpEmail(payload: OtpEmailPayload): Promise<void> {
      const smtpTargets = getSmtpTargets();

      if (smtpTargets.length === 0 || !env.EMAIL_FROM) {
        throw new AppError(
          "SMTP email service is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.",
          500,
          "EMAIL_NOT_CONFIGURED"
        );
      }

      let lastError: unknown;
      const attempts: string[] = [];

      for (const target of smtpTargets) {
        attempts.push(`${target.host}:${target.port}`);
        const transporter = buildTransporter(target);

        try {
          await transporter.verify();
          await transporter.sendMail({
            from: env.EMAIL_FROM,
            to: payload.email,
            subject: payload.subject,
            html: buildOtpHtml(payload),
          });
          return;
        } catch (error) {
          lastError = error;
          const diagnostics = getSmtpDiagnostics(error);
          if (diagnostics.code !== "ETIMEDOUT") {
            break;
          }
        }
      }

      const message = isAuthenticationError(lastError)
        ? "Failed to send verification email. SMTP authentication failed. Check EMAIL_USER, EMAIL_PASS, and app-password requirements."
        : "Failed to send verification email";

      throw new AppError(message, 502, "EMAIL_SEND_FAILED", {
        ...getSmtpDiagnostics(lastError),
        attempts,
      });
    },
    async getHealth(verifyConnection: boolean): Promise<EmailHealthStatus> {
      const smtpTargets = getSmtpTargets();
      const fromConfigured = Boolean(env.EMAIL_FROM);

      if (smtpTargets.length === 0) {
        return {
          provider: "smtp",
          configured: false,
          fromConfigured,
          connectionVerified: null,
          reason: "SMTP_TRANSPORT_NOT_CONFIGURED",
        };
      }

      if (!fromConfigured) {
        return {
          provider: "smtp",
          configured: true,
          fromConfigured: false,
          connectionVerified: null,
          reason: "EMAIL_FROM_MISSING",
        };
      }

      if (!verifyConnection) {
        return {
          provider: "smtp",
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
            provider: "smtp",
            configured: true,
            fromConfigured: true,
            connectionVerified: true,
            reason: null,
            attempts,
          };
        } catch (error) {
          lastError = error;
          const diagnostics = getSmtpDiagnostics(error);
          if (diagnostics.code !== "ETIMEDOUT") {
            break;
          }
        }
      }

      return {
        provider: "smtp",
        configured: true,
        fromConfigured: true,
        connectionVerified: false,
        reason: isAuthenticationError(lastError) ? "SMTP_AUTH_FAILED" : "SMTP_VERIFY_FAILED",
        attempts,
        diagnostics: getSmtpDiagnostics(lastError),
      };
    },
  };
}

function getBrevoBaseUrl(): string {
  return (env.BREVO_API_BASE_URL ?? "https://api.brevo.com").replace(/\/+$/, "");
}

function getBrevoDiagnostics(error: unknown): {
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

  const providerError = error as {
    code?: string;
    responseCode?: number;
    command?: string;
    message?: string;
  };

  return {
    code: providerError.code ?? null,
    responseCode: providerError.responseCode ?? null,
    command: providerError.command ?? null,
    message: providerError.message ?? null,
  };
}

function createBrevoProvider(): EmailProvider {
  return {
    name: "brevo",
    isConfigured: () => Boolean(env.BREVO_API_KEY && env.EMAIL_FROM),
    async sendOtpEmail(payload: OtpEmailPayload): Promise<void> {
      if (!env.BREVO_API_KEY || !env.EMAIL_FROM) {
        throw new AppError(
          "Brevo API email service is not configured. Set BREVO_API_KEY and EMAIL_FROM.",
          500,
          "EMAIL_NOT_CONFIGURED"
        );
      }

      const sender = parseSender(env.EMAIL_FROM);
      const endpoint = `${getBrevoBaseUrl()}/v3/smtp/email`;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: sender.name ? { email: sender.email, name: sender.name } : { email: sender.email },
            to: [{ email: payload.email }],
            subject: payload.subject,
            htmlContent: buildOtpHtml(payload),
          }),
        });
      } catch (error) {
        throw new AppError("Failed to reach Brevo API", 502, "EMAIL_SEND_FAILED", {
          ...getBrevoDiagnostics(error),
          command: endpoint,
        });
      }

      if (!response.ok) {
        const responseText = await response.text();
        throw new AppError("Failed to send verification email via Brevo API", 502, "EMAIL_SEND_FAILED", {
          code: `HTTP_${response.status}`,
          responseCode: response.status,
          command: endpoint,
          message: responseText || response.statusText,
        });
      }
    },
    async getHealth(verifyConnection: boolean): Promise<EmailHealthStatus> {
      const fromConfigured = Boolean(env.EMAIL_FROM);
      const configured = Boolean(env.BREVO_API_KEY && env.EMAIL_FROM);

      if (!configured) {
        return {
          provider: "brevo",
          configured: false,
          fromConfigured,
          connectionVerified: null,
          reason: "BREVO_API_NOT_CONFIGURED",
        };
      }

      if (!verifyConnection) {
        return {
          provider: "brevo",
          configured: true,
          fromConfigured: true,
          connectionVerified: null,
          reason: null,
          attempts: [`${getBrevoBaseUrl()}/v3/smtp/email`],
        };
      }

      const endpoint = `${getBrevoBaseUrl()}/v3/account`;
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "api-key": env.BREVO_API_KEY!,
          },
        });

        if (response.ok) {
          return {
            provider: "brevo",
            configured: true,
            fromConfigured: true,
            connectionVerified: true,
            reason: null,
            attempts: [endpoint],
          };
        }

        const responseText = await response.text();
        return {
          provider: "brevo",
          configured: true,
          fromConfigured: true,
          connectionVerified: false,
          reason: "BREVO_VERIFY_FAILED",
          attempts: [endpoint],
          diagnostics: {
            code: `HTTP_${response.status}`,
            responseCode: response.status,
            command: endpoint,
            message: responseText || response.statusText,
          },
        };
      } catch (error) {
        return {
          provider: "brevo",
          configured: true,
          fromConfigured: true,
          connectionVerified: false,
          reason: "BREVO_VERIFY_FAILED",
          attempts: [endpoint],
          diagnostics: {
            ...getBrevoDiagnostics(error),
            command: endpoint,
          },
        };
      }
    },
  };
}

function createEmailProvider(): EmailProvider {
  const provider = env.EMAIL_PROVIDER ?? (env.BREVO_API_KEY ? "brevo" : "smtp");

  if (provider === "brevo") {
    return createBrevoProvider();
  }

  return createSmtpProvider();
}

async function sendOtpEmail(payload: OtpEmailPayload): Promise<void> {
  const provider = createEmailProvider();

  if (!provider.isConfigured()) {
    if (env.NODE_ENV === "development") {
      console.log(`[DEV OTP] ${payload.email}: ${payload.otp}`);
      return;
    }

    throw new AppError(
      `Email service is not configured for provider "${provider.name}".`,
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  try {
    await provider.sendOtpEmail(payload);
  } catch (error) {
    if (env.NODE_ENV === "development") {
      console.warn(
        `[DEV OTP FALLBACK] Email delivery failed with provider "${provider.name}" for ${payload.email}. Using console OTP instead.`
      );
      console.warn(error);
      console.log(`[DEV OTP] ${payload.email}: ${payload.otp}`);
      return;
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to send verification email", 502, "EMAIL_SEND_FAILED");
  }
}

export async function getEmailServiceHealth(verifyConnection = false): Promise<EmailHealthStatus> {
  const provider = createEmailProvider();
  return provider.getHealth(verifyConnection);
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
