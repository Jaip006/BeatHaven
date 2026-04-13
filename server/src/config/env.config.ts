import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const emailFromSchema = z
  .string()
  .refine((value) => {
    const trimmedValue = value.trim();
    const plainEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const displayNameEmailPattern = /^[^<>]+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>$/;

    return (
      plainEmailPattern.test(trimmedValue) ||
      displayNameEmailPattern.test(trimmedValue)
    );
  }, "Invalid sender email format");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["staging", "production", "development"])
    .default("development"),
  PORT: z.string().transform(Number).default(8000),

  MONGO_URI: z.string().default("mongodb://localhost:27017/beathaven"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  FRONTEND_URLS: z.string().optional(),

  JWT_ACCESS_SECRET: z
    .string()
    .default("your_super_secret_access_token_key_here_min_32_chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .default("your_super_secret_refresh_token_key_here_min_32_chars"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(["smtp", "brevo"]).optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).optional(),
  EMAIL_PORT_FALLBACKS: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: emailFromSchema.optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_API_BASE_URL: z.string().url().optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
});

/**
 * Validate environment variables
 * This will crash the application if any required variable is missing or invalid
 */

function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error("Invalid or missing environment variables:\n");
      parsed.error.issues.forEach((issue) => {
        console.error(`  ❌ ${issue.path.join(".")}: ${issue.message}`);
      });

      console.error(
        "\n⚠️  Please check your .env file and ensure all required variables are set correctly.\n"
      );
      process.exit(1);
    }

    const validatedEnv = parsed.data;

    if (validatedEnv.NODE_ENV === "production") {
      const startupErrors: string[] = [];

      if (!validatedEnv.FRONTEND_URL || validatedEnv.FRONTEND_URL.includes("localhost")) {
        startupErrors.push(
          "FRONTEND_URL must be your deployed frontend URL in production (not localhost)."
        );
      }

      const provider = validatedEnv.EMAIL_PROVIDER ?? "smtp";

      if (provider === "brevo") {
        if (!validatedEnv.BREVO_API_KEY || !validatedEnv.EMAIL_FROM) {
          startupErrors.push(
            "Email OTP is required for signup in production. For Brevo API set BREVO_API_KEY and EMAIL_FROM."
          );
        }
      } else if (
        !validatedEnv.EMAIL_HOST ||
        !validatedEnv.EMAIL_PORT ||
        !validatedEnv.EMAIL_USER ||
        !validatedEnv.EMAIL_PASS ||
        !validatedEnv.EMAIL_FROM
      ) {
        startupErrors.push(
          "Email OTP is required for signup in production. For SMTP set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM."
        );
      }

      if (
        validatedEnv.JWT_ACCESS_SECRET === "your_super_secret_access_token_key_here_min_32_chars" ||
        validatedEnv.JWT_REFRESH_SECRET === "your_super_secret_refresh_token_key_here_min_32_chars"
      ) {
        startupErrors.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be custom values in production.");
      }

      if (startupErrors.length > 0) {
        console.error("Invalid production environment configuration:\n");
        startupErrors.forEach((message) => {
          console.error(`  - ${message}`);
        });
        console.error("\nUpdate your deployment environment variables and redeploy.\n");
        process.exit(1);
      }
    }

    return validatedEnv;
  } catch (error) {
    console.error("\n❌ ENVIRONMENT CONFIGURATION ERROR\n");
    console.error(error);
    process.exit(1);
  }
}

/**
 * Validated and typed environment configuration
 * Import this instead of using process.env directly
 */
export const env = validateEnv();

/**
 * Type-safe environment configuration object
 */
export type Env = z.infer<typeof envSchema>;

// Log successful validation in development
if (env.NODE_ENV === "development") {
  console.log("✓ Environment variables validated successfully");
}
