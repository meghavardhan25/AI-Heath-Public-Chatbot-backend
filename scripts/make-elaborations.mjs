import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/data/knowledgeSeed.raw.json"), "utf8"),
);

const starters = [
  "Across different ages and medical backgrounds,",
  "When you compare online articles with your own story,",
  "If cost or transportation affects what you can do next,",
  "Before you change diet, exercise, or supplements substantially,",
  "Because family history sometimes shifts risk,",
  "When symptoms overlap with stress, poor sleep, or dehydration,",
  "If you recently started a new medicine or higher dose,",
  "For travelers, athletes, or outdoor workers,",
  "When a symptom keeps returning after brief improvement,",
  "If you are caring for someone else while unwell yourself,",
  "Because language or health-literacy barriers exist,",
  "When you are unsure whether to wait or go today,",
  "If you use devices (contacts, hearing aids, CPAP),",
  "For people with diabetes, clotting disorders, or immune conditions,",
  "When pain or fever interferes with eating or drinking,",
  "If you notice new swelling, rashes, or color changes in the skin,",
  "Because mental health and physical symptoms often interact,",
  "When you need documentation for school, work, or travel,",
  "If substance use or withdrawal could be involved,",
  "When you are pregnant, could be pregnant, or are breastfeeding,",
];

const middles = [
  "it helps to write the first day you noticed the problem, what you tried, and what changed.",
  "bring a concise timeline to your clinician—patterns matter more than a perfect vocabulary.",
  "ask what same-day options exist: telehealth, urgent care, or nurse advice lines.",
  "request a review of interactions if you take more than a few regular medicines.",
  "mention screening tests you have skipped or postponed so advice stays complete.",
  "note sleep, caffeine, alcohol, and stress—they often change symptom thresholds.",
  "report it early; timing can change which tests are useful.",
  "add hydration, shade, pacing, and recovery days into the plan—not only symptom relief.",
  "track triggers such as meals, activity, posture, or time of day.",
  "ask for a written after-visit summary you can share with family caregivers.",
  "ask for an interpreter or translated handouts if that improves safety.",
  "many clinics offer triage questionnaires—use them rather than guessing.",
  "mention device fit, cleaning, and duration of use when relevant.",
  "ask how monitoring (home BP, glucose, pulse ox) should change during illness.",
  "prioritize fluid intake and clinician guidance before stacking more OTC products.",
  "photograph rashes or swelling that fluctuates, with timestamps.",
  "say if anxiety, panic, or low mood arrived with the physical symptoms.",
  "your clinician can provide a note only after an appropriate evaluation.",
  "seek nonjudgmental care—withdrawal and cravings are medical issues too.",
  "ask which non-prescription products and doses are truly safe for you.",
];

const ends = [
  "This paragraph is unique to this topic slot in the offline library and is not a diagnosis.",
  "Use it as a conversation starter with a licensed professional who knows your chart.",
  "Local public health offices sometimes publish region-specific guidance worth comparing.",
  "Emergency departments are for severe or sudden problems; routine refills usually are not.",
  "Pediatric and geriatric dosing differ—avoid adult assumptions for children or frail elders.",
  "If something feels unlike any prior episode, say that explicitly—it is a red-flag phrase clinicians listen for.",
];

const out = raw.map((row, i) => {
  const k = row.kw[0];
  const s = starters[i % starters.length];
  const m = middles[(i * 3) % middles.length];
  const e = ends[(i * 5) % ends.length];
  return `${s} thinking specifically about **${k}**: ${m} ${e}`;
});

fs.writeFileSync(
  path.join(__dirname, "../src/data/knowledgeElaborations.json"),
  JSON.stringify(out, null, 2),
);
console.log("wrote", out.length, "elaborations");
