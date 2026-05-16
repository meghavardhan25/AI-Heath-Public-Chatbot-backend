import { KnowledgeEntry } from "../models/KnowledgeEntry.model";
import type { ChatMode } from "./modes";
import {
  matchQualityForTieBreak,
  retitleKnowledgeMarkdown,
  scoreKnowledgeMatch,
} from "./knowledgeMatch";

/**
 * Returns the best matching knowledge entry **as stored** in MongoDB — full unique markdown per topic.
 * No extra intros, tables, or duplicate “Important” blocks (those belong in the seed text itself).
 */
export async function getKnowledgeDbResponse(
  userText: string,
  mode: ChatMode,
): Promise<string | null> {
  const trimmed = userText.trim();
  if (!trimmed) return null;

  const tokens = trimmed
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);

  let candidates: {
    keywords: string[];
    response: string;
    mode?: ChatMode;
    priority?: number;
  }[];
  try {
    if (tokens.length > 0) {
      candidates = await KnowledgeEntry.find({
        keywords: { $in: tokens },
      })
        .limit(800)
        .lean();
    } else {
      candidates = [];
    }

    if (!candidates.length) {
      candidates = await KnowledgeEntry.find({}).limit(400).lean();
    }
  } catch (e) {
    console.error("[knowledgeDb] query error:", e);
    return null;
  }

  if (!candidates.length) return null;

  type Scored = {
    response: string;
    score: number;
    priority: number;
    quality: number;
    keywords: string[];
  };
  let best: Scored | null = null;

  for (const doc of candidates) {
    if (doc.mode && doc.mode !== mode) continue;
    const score = scoreKnowledgeMatch(trimmed, doc.keywords);
    const priority = doc.priority ?? 0;
    const quality = matchQualityForTieBreak(trimmed, doc.keywords);
    if (score <= 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score &&
        (quality > best.quality ||
          (quality === best.quality && priority > best.priority)))
    ) {
      best = {
        response: doc.response,
        score,
        priority,
        quality,
        keywords: doc.keywords,
      };
    }
  }

  if (!best || best.score <= 0) return null;

  const body = retitleKnowledgeMarkdown(
    trimmed,
    best.response.trim(),
    best.keywords,
  );
  return body;
}
