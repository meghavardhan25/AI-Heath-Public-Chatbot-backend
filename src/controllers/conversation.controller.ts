import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";

export async function listConversations(req: AuthRequest, res: Response): Promise<void> {
  const convs = await Conversation.find({ userId: req.userId })
    .sort({ updatedAt: -1 })
    .select("title mode updatedAt createdAt")
    .lean();
  res.json(convs);
}

export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const conv = await Conversation.findById(id).lean();

  if (!conv || conv.userId.toString() !== req.userId) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }

  const messages = await Message.find({ conversationId: id })
    .sort({ createdAt: 1 })
    .select("role content createdAt")
    .lean();

  res.json({ ...conv, messages });
}

export async function deleteConversation(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const conv = await Conversation.findById(id);

  if (!conv || conv.userId.toString() !== req.userId) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }

  await Message.deleteMany({ conversationId: id });
  await conv.deleteOne();
  res.status(204).send();
}
