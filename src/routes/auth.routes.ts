import { Router } from "express";
import { register, login, googleAuth, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", (req, res, next) => {
  register(req, res).catch(next);
});

router.post("/login", (req, res, next) => {
  login(req, res).catch(next);
});

router.post("/google", (req, res, next) => {
  googleAuth(req, res).catch(next);
});

router.get("/me", requireAuth, (req, res, next) => {
  getMe(req as Parameters<typeof getMe>[0], res).catch(next);
});

export default router;
