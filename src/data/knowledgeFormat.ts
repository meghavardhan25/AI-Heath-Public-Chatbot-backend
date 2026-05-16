/**
 * Wraps topic-specific paragraphs — no shared “context / when to seek care” boilerplate.
 * Each topic supplies its own title and body copy.
 */
export function topicArticle(title: string, paragraphs: string[]): string {
  const body = paragraphs.map((p) => p.trim()).filter(Boolean).join("\n\n");
  return `### ${title}\n\n${body}\n\n---\n*Educational information only. Not personalized medical advice.*`;
}
