import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { ensureKnowledgeSeed } from "./lib/ensureKnowledgeSeed";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import conversationRoutes from "./routes/conversation.routes";
import ocrRoutes from "./routes/ocr.routes";

const app = express();
const PORT = process.env.PORT ?? 5000;

const frontendOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: frontendOrigins.length <= 1 ? frontendOrigins[0] : frontendOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/ocr", ocrRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  },
);

connectDB()
  .then(async () => {
    await ensureKnowledgeSeed();
    app.listen(PORT, () => {
      console.log(`\n🏥 HealthBot API running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
