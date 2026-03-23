"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const emailFromSchema = zod_1.z
    .string()
    .refine((value) => {
    const trimmedValue = value.trim();
    const plainEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const displayNameEmailPattern = /^[^<>]+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>$/;
    return (plainEmailPattern.test(trimmedValue) ||
        displayNameEmailPattern.test(trimmedValue));
}, "Invalid sender email format");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["staging", "production", "development"])
        .default("development"),
    PORT: zod_1.z.string().transform(Number).default(8000),
    MONGO_URI: zod_1.z.string().default("mongodb://localhost:27017/beathaven"),
    FRONTEND_URL: zod_1.z.string().default("http://localhost:5173"),
    JWT_ACCESS_SECRET: zod_1.z
        .string()
        .default("your_super_secret_access_token_key_here_min_32_chars"),
    JWT_REFRESH_SECRET: zod_1.z
        .string()
        .default("your_super_secret_refresh_token_key_here_min_32_chars"),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    // Email
    EMAIL_HOST: zod_1.z.string().optional(),
    EMAIL_PORT: zod_1.z.string().transform(Number).optional(),
    EMAIL_USER: zod_1.z.string().optional(),
    EMAIL_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: emailFromSchema.optional(),
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
            console.error("\n⚠️  Please check your .env file and ensure all required variables are set correctly.\n");
            process.exit(1);
        }
        return parsed.data;
    }
    catch (error) {
        console.error("\n❌ ENVIRONMENT CONFIGURATION ERROR\n");
        console.error(error);
        process.exit(1);
    }
}
/**
 * Validated and typed environment configuration
 * Import this instead of using process.env directly
 */
exports.env = validateEnv();
// Log successful validation in development
if (exports.env.NODE_ENV === "development") {
    console.log("✓ Environment variables validated successfully");
}
