import { generateGeminiResponse, resolveGeminiApiKeys } from "./gemini";
import { generateGroqResponse, resolveGroqApiKeys } from "./groq";
import type { Msg } from "./ai.types";

export type { Msg } from "./ai.types";

type Provider = "gemini" | "groq";

function resolveProviderOrder(): Provider[] {
  const raw = process.env.AI_PROVIDER_ORDER?.trim().toLowerCase();
  const hasGemini = resolveGeminiApiKeys().length > 0;
  const hasGroq = resolveGroqApiKeys().length > 0;

  if (raw) {
    const wanted = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const out: Provider[] = [];
    for (const w of wanted) {
      if (w === "gemini" && hasGemini) out.push("gemini");
      if (w === "groq" && hasGroq) out.push("groq");
    }
    return out;
  }

  const out: Provider[] = [];
  if (hasGemini) out.push("gemini");
  if (hasGroq) out.push("groq");
  return out;
}

/**
 * Tries providers in order (default: Gemini, then Groq). Set AI_PROVIDER_ORDER=groq,gemini to prefer Groq.
 * Requires at least one of GEMINI_API_KEY or GROQ_API_KEY / GROQ_API_KEYS.
 */
export async function generateChatResponse(
  systemPrompt: string,
  messages: Msg[],
  locale = "en",
): Promise<string> {
  const order = resolveProviderOrder();
  if (order.length === 0) {
    throw new Error(
      "No AI provider configured (set GEMINI_API_KEY and/or GROQ_API_KEY / GROQ_API_KEYS)",
    );
  }

  let lastErr: unknown;

  for (let i = 0; i < order.length; i++) {
    const p = order[i];
    try {
      if (p === "gemini") {
        return await generateGeminiResponse(systemPrompt, messages, locale);
      }
      return await generateGroqResponse(systemPrompt, messages, locale);
    } catch (err) {
      lastErr = err;
      console.warn(`[ai] Provider "${p}" failed:`, err);
      if (i < order.length - 1) {
        console.warn(`[ai] Trying next provider: "${order[i + 1]}"`);
      }
    }
  }

  throw lastErr ?? new Error("All AI providers failed");
}
