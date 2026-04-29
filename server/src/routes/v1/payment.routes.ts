import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import asyncHandler from "../../utils/asyncHandler";
import AppError from "../../utils/appError";
import { requireAuth } from "../../middlewares/auth.middleware";
import { env } from "../../config/env.config";

const router = Router();

router.post(
  "/create-order",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body as { amount?: number };

    if (!amount || typeof amount !== "number" || amount < 100) {
      throw new AppError("Invalid amount", 400, "INVALID_AMOUNT");
    }

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Payment gateway not configured", 503, "PAYMENT_NOT_CONFIGURED");
    }

    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    let order;
    try {
      order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `bh_${Date.now()}`,
      });
    } catch (rzpErr: any) {
      console.error("[Razorpay] Order creation failed:", rzpErr?.error ?? rzpErr);
      const msg = rzpErr?.error?.description ?? rzpErr?.message ?? "Razorpay order creation failed";
      throw new AppError(msg, 502, "RAZORPAY_ERROR");
    }

    res.status(201).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency } });
  })
);

export default router;
