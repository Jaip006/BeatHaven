import { Router } from "express";
import authRouter from "./auth.routes";
import beatRouter from "./beat.routes";
import lyricsRouter from "./lyrics.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/beats", beatRouter);
router.use("/lyrics", lyricsRouter);

export default router;
