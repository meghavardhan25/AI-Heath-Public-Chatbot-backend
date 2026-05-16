import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { User } from "../models/User.model";

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as `${number}${"s" | "m" | "h" | "d" | "w"}` | number;
  return jwt.sign({ userId }, secret, { expiresIn });
}

function safeUser(user: { _id: object; name?: string | null; email: string; image?: string | null }) {
  return { id: user._id.toString(), name: user.name ?? null, email: user.email, image: user.image ?? null };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), password: hash });
  const token = signToken(user._id.toString());

  res.status(201).json({ token, user: safeUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user?.password) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signToken(user._id.toString());
  res.json({ token, user: safeUser(user) });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential?: string };
  if (!credential) {
    res.status(400).json({ error: "Google credential is required." });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "Google OAuth is not configured on this server." });
    return;
  }

  const client = new OAuth2Client(clientId);
  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({
      error:
        "Google sign-in could not be verified. Check that this server GOOGLE_CLIENT_ID matches the Web client used on the login page and that authorized JavaScript origins include your app URL (e.g. http://localhost:3000).",
    });
    return;
  }
  if (!payload?.email) {
    res.status(400).json({ error: "Could not extract email from Google credential." });
    return;
  }

  const emailNorm = payload.email.toLowerCase();
  let user = await User.findOne({ email: emailNorm });
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: emailNorm,
      googleId: payload.sub,
      image: payload.picture,
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    user.image = payload.picture;
    await user.save();
  }

  const token = signToken(user._id.toString());
  res.json({ token, user: safeUser(user) });
}

export async function getMe(req: Request & { userId?: string }, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: safeUser(user) });
}
