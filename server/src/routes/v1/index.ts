import { Router } from "express";
import authRouter from "./auth.routes";
import beatRouter from "./beat.routes";
import lyricsRouter from "./lyrics.routes";
import communityRouter from "./community.routes";
import paymentRouter from "./payment.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/beats", beatRouter);
router.use("/lyrics", lyricsRouter);
router.use("/community", communityRouter);
router.use("/payments", paymentRouter);

export default router;
