import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { env } from "./config/env.config";
import connectDB from "./config/db.config";
import v1Routes from "./routes/v1/index";
import errorHandlerMiddleware from "./middlewares/errorHandler";
import notFoundMiddleware from "./middlewares/notFound";
import cookieParser from "cookie-parser";

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Logging (only in development)
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS Configuration
const allowedOrigins = new Set(
  [env.FRONTEND_URL, env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser and same-origin requests (no Origin header)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-VERIFY", "x-verify"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health checks for uptime pings
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "beathaven-api" });
});

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "beathaven-api" });
});

//  API ROUTES

app.use("/api/v1", v1Routes);


// API NOT FOUND

app.use("/api", notFoundMiddleware);


//  GLOBAL ERROR HANDLER

app.use(errorHandlerMiddleware);

// SERVER START

const args = process.argv.slice(2);
const portArgIndex = args.indexOf("--port");
const PORT =
  portArgIndex !== -1 ? Number(args[portArgIndex + 1]) : env.PORT;

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});
