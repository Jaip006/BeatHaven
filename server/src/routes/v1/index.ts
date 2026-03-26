import { Router } from "express";
import authRouter from "./auth.routes";
import beatRouter from "./beat.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/beats", beatRouter);

export default router;
