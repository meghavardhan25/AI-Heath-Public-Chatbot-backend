import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// optionalAuth: chat works for guests too; history saved only when logged in
router.post("/", optionalAuth, (req, res, next) => {
  sendMessage(req as Parameters<typeof sendMessage>[0], res).catch(next);
});

export default router;
