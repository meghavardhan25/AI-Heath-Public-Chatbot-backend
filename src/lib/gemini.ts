import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Msg } from "./ai.types";

/**
 * Default order: favor separate quota pools and higher RPM/RPD (see AI Studio charts).
 * Typical free-tier headroom: 3.1 Flash-Lite (very high RPD), Gemma (~30 RPM),
 * Gemini 3 Flash (distinct pool from 2.5), then 2.5 Flash-Lite / 2.5 Flash.
 * Override with GEMINI_MODEL_ORDER=comma,separated,ids
 */
const DEFAULT_MODEL_CHAIN = [
  "gemini-3.1-flash-lite-preview",
  "gemma-3-4b-it",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function httpStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  return (err as { status?: number }).status;
}

function isRateLimitError(err: unknown): boolean {
  return httpStatus(err) === 429;
}

function isNotFoundError(err: unknown): boolean {
  return httpStatus(err) === 404;
}

/** Parse RetryInfo.retryDelay like "20s" from Gemini errorDetails. */
function getRetryDelayMs(err: unknown): number {
  const details = (err as { errorDetails?: unknown[] })?.errorDetails;
  if (!Array.isArray(details)) return 4000;
  for (const d of details) {
    if (typeof d !== "object" || d === null) continue;
    const t = (d as { ["@type"]?: string })["@type"];
    if (t?.includes("RetryInfo")) {
      const raw = (d as { retryDelay?: string }).retryDelay;
      if (raw) {
        const secs = parseFloat(String(raw).replace(/s$/i, "").trim());
        if (!Number.isNaN(secs) && secs > 0) {
          return Math.min(Math.ceil(secs * 1000), 60_000);
        }
      }
    }
  }
  return 4000;
}

function resolveModelChain(): string[] {
  const order = process.env.GEMINI_MODEL_ORDER?.trim();
  if (order) {
    return order
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const primary = process.env.GEMINI_MODEL?.trim();
  const fallback = process.env.GEMINI_MODEL_FALLBACK?.trim();
  if (primary || fallback) {
    return [primary, fallback].filter(Boolean) as string[];
  }
  return [...DEFAULT_MODEL_CHAIN];
}

/**
 * Multiple keys: set GEMINI_API_KEYS=key1,key2 or comma-separated GEMINI_API_KEY.
 * Tries each key only after the previous key exhausts all models (or errors).
 */
export function resolveGeminiApiKeys(): string[] {
  const fromList = process.env.GEMINI_API_KEYS?.trim();
  if (fromList) {
    return fromList.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const single = process.env.GEMINI_API_KEY?.trim();
  if (!single) return [];
  if (single.includes(",")) {
    return single.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [single];
}

async function sendMessageWith429Retries(
  chat: ReturnType<
    ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["startChat"]
  >,
  text: string,
  maxAttempts = 2,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await chat.sendMessage(text);
      return result.response.text().trim();
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === maxAttempts - 1) throw err;
      const delay = getRetryDelayMs(err);
      console.warn(
        `[gemini] 429 on same model, retry in ${delay}ms (${attempt + 2}/${maxAttempts})`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

function buildModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  systemPrompt: string,
  locale: string,
) {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      systemPrompt +
      (locale !== "en"
        ? ` Reply in the same language the user is writing in (locale: ${locale}).`
        : ""),
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });
}

export async function generateGeminiResponse(
  systemPrompt: string,
  messages: Msg[],
  locale = "en",
): Promise<string> {
  const keys = resolveGeminiApiKeys();
  if (keys.length === 0) throw new Error("GEMINI_API_KEY not set");

  const chain = resolveModelChain();
  if (chain.length === 0) {
    throw new Error("No models configured (GEMINI_MODEL_ORDER / GEMINI_MODEL empty)");
  }

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = messages[messages.length - 1];
  if (!last) throw new Error("No user message to send");

  const tryModel = async (
    genAI: GoogleGenerativeAI,
    modelName: string,
  ): Promise<string> => {
    const model = buildModel(genAI, modelName, systemPrompt, locale);
    const chat = model.startChat({ history });
    return sendMessageWith429Retries(chat, last.content, 2);
  };

  let lastErr: unknown;

  for (let ki = 0; ki < keys.length; ki++) {
    const genAI = new GoogleGenerativeAI(keys[ki]);
    try {
      for (let i = 0; i < chain.length; i++) {
        const modelName = chain[i];
        try {
          return await tryModel(genAI, modelName);
        } catch (err) {
          lastErr = err;
          const st = httpStatus(err);
          const isSkippable =
            isRateLimitError(err) || isNotFoundError(err) || st === 503;
          if (isSkippable && i < chain.length - 1) {
            console.warn(
              `[gemini] Model "${modelName}" failed (${st ?? "error"}); trying next: "${chain[i + 1]}"`,
            );
            continue;
          }
          throw err;
        }
      }
    } catch (err) {
      lastErr = err;
      if (ki < keys.length - 1) {
        console.warn(
          `[gemini] API key ${ki + 1}/${keys.length} failed; trying next Gemini API key`,
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr ?? new Error("Gemini: all API keys exhausted");
}
