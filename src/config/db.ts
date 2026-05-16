import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not set in environment variables");

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}
