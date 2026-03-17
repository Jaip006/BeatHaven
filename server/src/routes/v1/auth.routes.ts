import { Router } from "express";

const authRouter = Router();

/**
 * Auth routes — stubs for future implementation
 *
 * POST /api/v1/auth/register   → Register a new user
 * POST /api/v1/auth/login      → Login and receive access + refresh tokens
 * POST /api/v1/auth/refresh    → Refresh access token using refresh token
 * POST /api/v1/auth/logout     → Revoke refresh token
 * GET  /api/v1/auth/me         → Get current authenticated user
 */

authRouter.post("/register", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/login", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/refresh", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/logout", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.get("/me", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

export default authRouter;
