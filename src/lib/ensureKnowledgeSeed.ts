import { KNOWLEDGE_SEED_ENTRIES } from "../data/knowledgeSeed";
import { KnowledgeEntry } from "../models/KnowledgeEntry.model";

/**
 * On first deploy: if `knowledgeentries` is empty, inserts bundled seed data (100+ topics).
 * Safe to call on every startup — skips when any document exists.
 */
export async function ensureKnowledgeSeed(): Promise<void> {
  try {
    const n = await KnowledgeEntry.countDocuments();
    if (n > 0) return;

    const docs = KNOWLEDGE_SEED_ENTRIES.map((e) => ({
      keywords: e.keywords.map((k) => k.toLowerCase().trim()),
      response: e.response,
      priority: e.priority ?? 0,
    }));

    await KnowledgeEntry.insertMany(docs);
    console.log(
      `[knowledge] Auto-seeded ${docs.length} entries (empty collection on first run).`,
    );
  } catch (e) {
    console.error("[knowledge] Auto-seed failed:", e);
  }
}
