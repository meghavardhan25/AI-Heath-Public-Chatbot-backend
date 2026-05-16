import type { ChatMode } from "./modes";
import { KNOWLEDGE_SEED_ENTRIES } from "../data/knowledgeSeed";
import {
  matchQualityForTieBreak,
  retitleKnowledgeMarkdown,
  scoreKnowledgeMatch,
} from "./knowledgeMatch";

export { STATIC_HEALTH_KNOWLEDGE } from "../data/knowledgeSeed";

/** Shown when no keyword entry matches — long-form so users still get structured guidance. */
const GENERIC = `### We could not match a specific topic

Your question did not overlap strongly with our stored knowledge entries. Below is **broad guidance** you can use while you seek personalized care.

---

### How to get reliable answers

* **Primary care or urgent care** — Best for new symptoms, medication questions, and follow-up.
* **Pharmacists** — Excellent for drug interactions, over-the-counter choices, and how to take medicines safely.
* **Specialists** — Referrals from your primary clinician when needed.

---

### Trusted information sources (examples)

| Source | Use for |
| ------ | ------- |
| **CDC** (cdc.gov) | Infectious disease, vaccines, travel health |
| **WHO** (who.int) | Global guidance and outbreak updates |
| **Your national health authority** | Local schedules, alerts, and regulations |
| **MedlinePlus** (medlineplus.gov) | Plain-language articles on many conditions |

Always check the **publication date** and whether guidance applies to your country.

---

### When to seek urgent or emergency care

Seek **immediate** help (e.g. emergency number / ER) for possible:

* **Breathing difficulty** at rest, blue lips, or inability to speak full sentences
* **Chest pain** or pressure, especially with sweating, nausea, or pain in arm/jaw
* **Stroke signs** — facial droop, arm weakness, speech trouble (remember **FAST**)
* **Sudden severe headache** unlike any prior, especially with fever or stiff neck
* **Heavy bleeding**, **loss of consciousness**, or **severe allergic reaction** (throat swelling, widespread hives)

When unsure, many regions offer **nurse advice lines** or telehealth triage.

---

### Mental health

* **US**: Call or text **988** (Suicide & Crisis Lifeline) if you are in crisis.
* **Elsewhere**: Search for your country’s **crisis hotline** or go to the nearest emergency department if safety is at risk.
* Ongoing support: licensed therapists, counselors, or psychiatrists — your doctor can refer you.

---

### Prevention & everyday habits

* **Sleep** — Aim for a regular schedule; most adults need roughly **7–9 hours**.
* **Movement** — Regular activity supports heart, mood, and weight; even walking counts.
* **Nutrition** — Emphasize vegetables, fiber, and lean protein; limit excess sugar and ultra-processed foods.
* **Substances** — Follow clinician advice on alcohol; avoid mixing drugs without medical guidance.

---

### Important disclaimer

*⚠️ **Educational information only** — not a substitute for professional medical advice, diagnosis, or treatment.*

---

*This message appeared because **AI was unavailable** and no knowledge-base topic matched closely enough.*`;

export function getFallbackResponse(userText: string, mode: ChatMode): string {
  void mode;
  if (!userText.trim()) return GENERIC;

  let best: (typeof KNOWLEDGE_SEED_ENTRIES)[number] | null = null;
  let bestScore = 0;
  let bestQuality = 0;
  for (const entry of KNOWLEDGE_SEED_ENTRIES) {
    const s = scoreKnowledgeMatch(userText, entry.keywords);
    const q = matchQualityForTieBreak(userText, entry.keywords);
    const priority = entry.priority ?? 0;
    if (s <= 0) continue;
    if (
      !best ||
      s > bestScore ||
      (s === bestScore &&
        (q > bestQuality ||
          (q === bestQuality && priority > (best.priority ?? 0))))
    ) {
      bestScore = s;
      bestQuality = q;
      best = entry;
    }
  }

  if (best && bestScore > 0) {
    return retitleKnowledgeMarkdown(
      userText,
      best.response.trim(),
      best.keywords,
    );
  }
  return GENERIC;
}
