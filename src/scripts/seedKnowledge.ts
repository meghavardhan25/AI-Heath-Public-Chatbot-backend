import "dotenv/config";
import mongoose from "mongoose";
import { KNOWLEDGE_SEED_ENTRIES } from "../data/knowledgeSeed";
import { KnowledgeEntry } from "../models/KnowledgeEntry.model";

const force = process.argv.includes("--force");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  await mongoose.connect(url);
  await KnowledgeEntry.syncIndexes();

  const existing = await KnowledgeEntry.countDocuments();
  if (existing > 0 && !force) {
    console.log(
      `Knowledge entries already present (${existing}). Use --force to replace.`,
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  if (force && existing > 0) {
    await KnowledgeEntry.deleteMany({});
    console.log("Cleared existing knowledge entries.");
  }

  const docs = KNOWLEDGE_SEED_ENTRIES.map((e) => ({
    keywords: e.keywords.map((k) => k.toLowerCase().trim()),
    response: e.response,
    priority: e.priority ?? 0,
  }));

  await KnowledgeEntry.insertMany(docs);
  console.log(`Inserted ${docs.length} knowledge entries from KNOWLEDGE_SEED_ENTRIES.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
