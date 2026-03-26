import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";
import { verifyAccessToken, TokenPayload } from "../utils/jwt.utils";
import asyncHandler from "../utils/asyncHandler";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authorized, no token", 401, "UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError("Not authorized, token failed", 401, "UNAUTHORIZED");
  }
});

export const requireSeller = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "seller") {
    throw new AppError("Not authorized as a seller", 403, "FORBIDDEN");
  }
  next();
});
