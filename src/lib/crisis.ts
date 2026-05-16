const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bdon'?t want to live\b/i,
  /\bself[- ]harm\b/i,
  /\bcan'?t go on\b/i,
];

const RESOURCES = [
  { label: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 (US)" },
  { label: "Crisis Text Line", detail: "Text HOME to 741741 (US)" },
  {
    label: "Emergency",
    detail: "If in immediate danger, call emergency services (e.g. 911).",
  },
];

export type CrisisResult =
  | { level: "none" }
  | { level: "elevated"; reply: string };

export function detectCrisis(text: string): CrisisResult {
  if (!text.trim()) return { level: "none" };
  for (const re of CRISIS_PATTERNS) {
    if (re.test(text)) {
      const lines = [
        "It sounds like you may be going through something very difficult. Your safety matters. Please reach out to a crisis service right now — this chatbot cannot provide crisis counseling or monitor your safety.",
        "",
        "Resources:",
        ...RESOURCES.map((r) => `• ${r.label}: ${r.detail}`),
      ];
      return { level: "elevated", reply: lines.join("\n") };
    }
  }
  return { level: "none" };
}
