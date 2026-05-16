import { Schema, model, Document, Types } from "mongoose";
import type { ChatMode } from "../lib/modes";

export interface IKnowledgeEntry extends Document {
  _id: Types.ObjectId;
  keywords: string[];
  response: string;
  /** If set, entry only applies to this chat mode; omit for all modes */
  mode?: ChatMode;
  /** Higher wins on tie-breaks after keyword score */
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeEntrySchema = new Schema<IKnowledgeEntry>(
  {
    keywords: [{ type: String, required: true, lowercase: true, trim: true }],
    response: { type: String, required: true },
    mode: {
      type: String,
      enum: [
        "general",
        "symptom",
        "disease",
        "medication",
        "mental_health",
        "vaccination",
        "outbreak",
        "stats",
        "accessibility",
      ],
      required: false,
    },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true },
);

knowledgeEntrySchema.index({ keywords: 1 });
knowledgeEntrySchema.index({ mode: 1, priority: -1 });

export const KnowledgeEntry = model<IKnowledgeEntry>(
  "KnowledgeEntry",
  knowledgeEntrySchema,
);
