import type { Msg } from "./ai.types";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Default chain: higher RPD / RPM first (see Groq dashboard rate limits).
 * Override: GROQ_MODEL_ORDER=model1,model2
 */
const DEFAULT_MODEL_CHAIN = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Comma-separated keys in GROQ_API_KEYS, or single GROQ_API_KEY. */
export function resolveGroqApiKeys(): string[] {
  const multi = process.env.GROQ_API_KEYS?.trim();
  if (multi) {
    return multi
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = process.env.GROQ_API_KEY?.trim();
  return single ? [single] : [];
}

function resolveModelChain(): string[] {
  const order = process.env.GROQ_MODEL_ORDER?.trim();
  if (order) {
    return order
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_MODEL_CHAIN];
}

function buildSystemContent(systemPrompt: string, locale: string): string {
  return (
    systemPrompt +
    (locale !== "en"
      ? ` Reply in the same language the user is writing in (locale: ${locale}).`
      : "")
  );
}

function buildOpenAIMessages(
  systemPrompt: string,
  messages: Msg[],
  locale: string,
): { role: "system" | "user" | "assistant"; content: string }[] {
  const sys = buildSystemContent(systemPrompt, locale);
  const out: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: sys },
  ];
  for (const m of messages) {
    out.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    });
  }
  return out;
}

type GroqError = Error & { status: number; responseHeaders: Headers };

function groqError(
  status: number,
  message: string,
  responseHeaders: Headers,
): GroqError {
  const e = new Error(message) as GroqError;
  e.status = status;
  e.responseHeaders = responseHeaders;
  return e;
}

function getRetryAfterMs(headers: Headers): number {
  const raw = headers.get("retry-after");
  if (!raw) return 4000;
  const secs = parseFloat(String(raw).trim());
  if (!Number.isFinite(secs) || secs <= 0) return 4000;
  return Math.min(Math.ceil(secs * 1000), 60_000);
}

function isSkippableModelStatus(status: number): boolean {
  return status === 429 || status === 404 || status === 503;
}

/** After all models failed on one key, try another key (quota / invalid key). */
function shouldTryNextApiKey(err: unknown, hasAnotherKey: boolean): boolean {
  if (!hasAnotherKey) return false;
  const ge = err as GroqError;
  const st = ge.status;
  if (st === 401 || st === 403) return true;
  if (st === 429 || st === 503) return true;
  const msg = String((err as Error)?.message ?? "").toLowerCase();
  if (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("capacity") ||
    msg.includes("insufficient")
  ) {
    return true;
  }
  return false;
}

async function groqChatCompletion(
  apiKey: string,
  model: string,
  openaiMessages: ReturnType<typeof buildOpenAIMessages>,
): Promise<string> {
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    let detail = await res.text();
    try {
      const j = JSON.parse(detail) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* keep body */
    }
    throw groqError(
      res.status,
      `Groq ${res.status}: ${detail}`,
      res.headers,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned empty content");
  return text;
}

async function sendWith429Retries(
  apiKey: string,
  model: string,
  openaiMessages: ReturnType<typeof buildOpenAIMessages>,
  maxAttempts = 2,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await groqChatCompletion(apiKey, model, openaiMessages);
    } catch (err) {
      lastErr = err;
      const ge = err as GroqError;
      if (ge.status !== 429 || attempt === maxAttempts - 1) throw err;
      const delay = getRetryAfterMs(ge.responseHeaders);
      console.warn(
        `[groq] 429 on model "${model}", retry in ${delay}ms (${attempt + 2}/${maxAttempts})`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function generateWithSingleApiKey(
  apiKey: string,
  chain: string[],
  openaiMessages: ReturnType<typeof buildOpenAIMessages>,
): Promise<string> {
  let lastErr: unknown;

  for (let i = 0; i < chain.length; i++) {
    const modelName = chain[i];
    try {
      return await sendWith429Retries(apiKey, modelName, openaiMessages, 2);
    } catch (err) {
      lastErr = err;
      const st = (err as GroqError).status;
      if (
        st !== undefined &&
        isSkippableModelStatus(st) &&
        i < chain.length - 1
      ) {
        console.warn(
          `[groq] Model "${modelName}" failed (${st}); trying next: "${chain[i + 1]}"`,
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}

export async function generateGroqResponse(
  systemPrompt: string,
  messages: Msg[],
  locale = "en",
): Promise<string> {
  const keys = resolveGroqApiKeys();
  if (keys.length === 0) throw new Error("GROQ_API_KEY or GROQ_API_KEYS not set");

  const chain = resolveModelChain();
  if (chain.length === 0) {
    throw new Error("No Groq models configured (GROQ_MODEL_ORDER empty)");
  }

  if (messages.length === 0) {
    throw new Error("No messages to send");
  }

  const openaiMessages = buildOpenAIMessages(systemPrompt, messages, locale);

  let lastErr: unknown;

  for (let k = 0; k < keys.length; k++) {
    const apiKey = keys[k];
    const masked = `${apiKey.slice(0, 6)}…`;
    try {
      return await generateWithSingleApiKey(apiKey, chain, openaiMessages);
    } catch (err) {
      lastErr = err;
      const tryNext = shouldTryNextApiKey(err, k < keys.length - 1);
      if (tryNext) {
        console.warn(
          `[groq] Key ${masked} exhausted or rejected (${(err as GroqError).status ?? "?"}); trying next API key (${k + 2}/${keys.length})`,
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}
