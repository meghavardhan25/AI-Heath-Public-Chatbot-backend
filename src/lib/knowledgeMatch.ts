function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word match only — avoids "ear" matching inside "heart". */
export function wholeWordMatch(userTextLower: string, word: string): boolean {
  if (word.length < 2) return false;
  return new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(userTextLower);
}

/**
 * True if the user text matches this keyword (full phrase substring, or whole-word matches for words).
 */
export function keywordMatchesPhrase(userText: string, kw: string): boolean {
  const lower = userText.toLowerCase();
  const k = kw.toLowerCase().trim();
  if (k.length <= 1) return false;
  if (lower.includes(k)) return true;
  if (k.includes(" ")) {
    const words = k.split(/\s+/).filter((w) => w.length >= 2);
    return words.some((w) => wholeWordMatch(lower, w));
  }
  return wholeWordMatch(lower, k);
}

/** Title casing for a single keyword phrase (used in seeds and retitling). */
export function formatTitleFromKeyword(kw: string): string {
  return kw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Prefer the longest keyword phrase present in the user text, else the best whole-word overlap. */
export function pickBestTitleKeyword(userText: string, keywords: string[]): string {
  const lower = userText.toLowerCase();
  let best = keywords[0] ?? "";
  let bestLen = 0;
  for (const kw of keywords) {
    const kl = kw.toLowerCase();
    if (lower.includes(kl) && kl.length > bestLen) {
      bestLen = kl.length;
      best = kw;
    }
  }
  if (bestLen > 0) return best;
  for (const kw of keywords) {
    const parts = kw
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    for (const p of parts) {
      if (wholeWordMatch(lower, p) && p.length > bestLen) {
        bestLen = p.length;
        best = kw;
      }
    }
  }
  return best;
}

/** Stronger overlap wins when raw keyword counts tie (e.g. two topics each match one word). */
export function matchQualityForTieBreak(userText: string, keywords: string[]): number {
  const lower = userText.toLowerCase();
  let q = 0;
  for (const kw of keywords) {
    const kl = kw.toLowerCase();
    if (lower.includes(kl)) {
      q += kl.length * 10;
      continue;
    }
    const words = kl.split(/\s+/).filter((w) => w.length >= 2);
    for (const w of words) {
      if (wholeWordMatch(lower, w)) q += w.length;
    }
  }
  return q;
}

/** Replace the first Markdown ### title so it reflects the keyword that best matches the user message. */
export function retitleKnowledgeMarkdown(
  userText: string,
  markdown: string,
  keywords: string[],
): string {
  if (!keywords.length) return markdown;
  const kw = pickBestTitleKeyword(userText, keywords);
  const newTitle = formatTitleFromKeyword(kw);
  return markdown.replace(/^### [^\n]+/m, `### ${newTitle}`);
}

/** Legacy: count full substring matches only. */
export function scoreKeywords(userText: string, keywords: string[]): number {
  const lower = userText.toLowerCase();
  return keywords.reduce(
    (n, kw) => n + (lower.includes(kw.toLowerCase()) ? 1 : 0),
    0,
  );
}

/**
 * Score used for knowledge DB + static fallback: each keyword in the list that matches counts once.
 * Multi-word keywords also match if any significant word appears as a **whole word** in the user message.
 */
export function scoreKnowledgeMatch(userText: string, keywords: string[]): number {
  return keywords.reduce(
    (n, kw) => n + (keywordMatchesPhrase(userText, kw) ? 1 : 0),
    0,
  );
}
