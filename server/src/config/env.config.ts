import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["staging", "production", "development"])
    .default("development"),
  PORT: z.string().transform(Number).default(8000),

  MONGO_URI: z.string().default("mongodb://localhost:27017/beathaven"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

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
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
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

    return parsed.data;
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
