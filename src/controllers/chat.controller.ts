import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { detectCrisis } from "../lib/crisis";
import { generateChatResponse } from "../lib/ai";
import { getFallbackResponse } from "../lib/fallback";
import { getKnowledgeDbResponse } from "../lib/knowledgeDb";
import { buildSystemPrompt, type ChatMode } from "../lib/modes";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";

type ChatMessage = { role: "user" | "assistant"; content: string };

function titleFromMessage(text: string): string {
  return text.length > 55 ? text.slice(0, 52) + "…" : text;
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const { messages, mode, locale, conversationId } = req.body as {
    messages?: ChatMessage[];
    mode?: ChatMode;
    locale?: string;
    conversationId?: string;
  };

  const msgs = messages ?? [];
  const chatMode: ChatMode = mode ?? "general";
  const chatLocale = locale ?? "en";

  const lastUser = [...msgs].reverse().find((m) => m.role === "user");

  // Crisis check
  if (lastUser?.content) {
    const crisis = detectCrisis(lastUser.content);
    if (crisis.level === "elevated") {
      res.json({
        reply: crisis.reply,
        crisis: true,
        usedFallback: false,
        usedKnowledgeDb: false,
      });
      return;
    }
  }

  // Generate AI response
  const systemPrompt = buildSystemPrompt(chatMode);
  let reply = "";
  let usedFallback = false;
  let usedKnowledgeDb = false;

  try {
    reply = await generateChatResponse(systemPrompt, msgs, chatLocale);
  } catch (err) {
    console.error("[chat] All AI providers failed:", err);
    const kb = await getKnowledgeDbResponse(lastUser?.content ?? "", chatMode);
    if (kb) {
      reply = kb;
      usedKnowledgeDb = true;
      usedFallback = true;
    } else {
      reply = getFallbackResponse(lastUser?.content ?? "", chatMode);
      usedFallback = true;
    }
  }

  // Persist conversation for authenticated users
  let finalConvId = conversationId ?? null;
  const userId = req.userId;

  if (userId && lastUser) {
    if (!finalConvId) {
      const conv = await Conversation.create({
        userId,
        mode: chatMode,
        title: titleFromMessage(lastUser.content),
      });
      finalConvId = conv._id.toString();

      // Store entire history for new conversations
      await Message.insertMany(
        msgs.map((m) => ({
          conversationId: conv._id,
          role: m.role,
          content: m.content,
        })),
      );
    } else {
      // Only store the new user message
      await Message.create({
        conversationId: finalConvId,
        role: "user",
        content: lastUser.content,
      });

      // Update updatedAt
      await Conversation.findByIdAndUpdate(finalConvId, { updatedAt: new Date() });
    }

    // Always store the assistant reply
    await Message.create({
      conversationId: finalConvId,
      role: "assistant",
      content: reply,
    });
  }

  res.json({
    reply,
    crisis: false,
    usedFallback,
    usedKnowledgeDb,
    conversationId: finalConvId,
  });
}
