import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  mode: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New conversation" },
    mode: { type: String, default: "general" },
  },
  { timestamps: true },
);

export const Conversation = model<IConversation>(
  "Conversation",
  conversationSchema,
);
