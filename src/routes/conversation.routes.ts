import { Router } from "express";
import {
  listConversations,
  getConversation,
  deleteConversation,
} from "../controllers/conversation.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res, next) => {
  listConversations(req as Parameters<typeof listConversations>[0], res).catch(next);
});

router.get("/:id", (req, res, next) => {
  getConversation(req as Parameters<typeof getConversation>[0], res).catch(next);
});

router.delete("/:id", (req, res, next) => {
  deleteConversation(req as Parameters<typeof deleteConversation>[0], res).catch(next);
});

export default router;
