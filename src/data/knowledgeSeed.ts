/**
 * Bundled health-education knowledge. Each `response` is a **complete, topic-specific**
 * Markdown article (no shared “Summary / Putting this in context” wrapper).
 * Seed MongoDB with `npm run seed:knowledge` or rely on first-run auto-seed.
 */

import { formatTitleFromKeyword } from "../lib/knowledgeMatch";
import { topicArticle } from "./knowledgeFormat";
import rawData from "./knowledgeSeed.raw.json";

export type KnowledgeSeedRow = {
  keywords: string[];
  response: string;
  priority?: number;
};

type RawRow = { kw: string[]; text: string };

function titleFromKw(kw: string[]): string {
  return formatTitleFromKeyword(kw[0]);
}

/** Core topics — each article is written specifically for that subject (no template body). */
const CORE: KnowledgeSeedRow[] = [
  {
    keywords: [
      "emergency",
      "911",
      "not breathing",
      "unconscious",
      "heart attack",
      "stroke",
      "severe bleeding",
      "overdose",
    ],
    priority: 10,
    response: topicArticle("Possible life-threatening emergency", [
      "⚠️ What you describe may require **immediate** emergency care. In many countries the right step is to call your **local emergency number** (for example **911** in the United States) or go to the **nearest emergency department** without delay when symptoms are severe, sudden, or rapidly worsening.",
      "Examples that usually need emergency services include **not breathing**, **turning blue**, **heavy bleeding that does not slow with pressure**, **signs of stroke** (face drooping, arm weakness, speech trouble), **crushing chest pain**, **loss of consciousness**, or **severe allergic reactions** with throat swelling or breathing difficulty.",
      "If you are unsure, it is reasonable to **call emergency services** and describe the situation—dispatch can help you decide. Do not drive yourself if you are dizzy, confused, or in severe pain.",
    ]),
  },
  {
    keywords: ["fever", "high temperature", "chills", "sweating", "febrile"],
    response: topicArticle("Fever — what it usually means", [
      "A **fever** is often defined as a measured temperature of about **100.4°F (38°C) or higher**. It is a common response to infections such as viruses or bacteria, and sometimes to inflammation or medications. Rest, fluids, and over-the-counter fever reducers **as directed on the label or by your clinician** are typical home measures for mild illness in otherwise healthy adults.",
      "Seek **prompt medical care** for fever in **infants under three months**, fever above about **103°F (39.4°C)**, fever lasting **more than three days**, or fever with **stiff neck**, **severe headache**, **rash**, **breathing difficulty**, **severe abdominal pain**, or **confusion**. Any fever in people with weakened immunity needs a lower threshold for calling a clinician.",
      "Your clinician may ask about travel, animal exposures, recent surgeries, and medications—those details change which causes are most likely.",
    ]),
  },
  {
    keywords: ["cold", "flu", "runny nose", "sore throat", "cough", "sneezing", "congestion", "influenza"],
    response: topicArticle("Colds, flu-like illness, and congestion", [
      "**Common colds** are usually caused by viruses and often improve within **7–10 days**. **Influenza (flu)** can feel similar but often starts more suddenly with higher fever, body aches, and fatigue. Rest, hydration, and symptom-relieving medicines appropriate for your age and conditions are typical supports.",
      "Annual **flu vaccination** is a key prevention strategy where it is available. Seek care if you have **trouble breathing**, **chest pain**, **confusion**, **severe dehydration**, symptoms that **worsen after initial improvement**, or symptoms that last **well beyond** the usual course.",
      "COVID-19 and other respiratory infections can overlap—follow local testing and isolation guidance when relevant.",
    ]),
  },
  {
    keywords: ["covid", "coronavirus", "covid-19", "positive test"],
    response: topicArticle("COVID-19 — general education", [
      "Illness caused by the **SARS-CoV-2** virus ranges from **mild respiratory symptoms** to **severe disease**. Guidance on **isolation**, **testing**, **antiviral medications**, and **vaccination** has changed over time and varies by country—use your **national health authority** as the primary reference.",
      "Seek **urgent or emergency care** for **difficulty breathing**, **persistent chest pain**, **new confusion**, **bluish lips or face**, or **inability to stay awake**. People at **higher risk** (older age, pregnancy, chronic heart/lung disease, diabetes, immune compromise) should have a lower threshold for contacting a clinician early.",
      "Recovery timelines vary; **persistent fatigue** or **shortness of breath** after infection should be evaluated rather than ignored.",
    ]),
  },
  {
    keywords: ["headache", "migraine", "head pain", "head hurts", "throbbing"],
    response: topicArticle("Headaches — patterns that matter", [
      "Many headaches are **tension-type** or **migraine**. Helpful self-care for mild attacks can include **hydration**, **rest in a dark room**, **limited screen time**, and **appropriate OTC pain medicines** if you do not have contraindications.",
      "Seek **same-day or emergency care** for the **worst headache of your life**, a headache that peaks in **seconds to a minute**, headache with **fever and stiff neck**, **new weakness or numbness**, **vision loss**, **after head injury**, or a **new pattern** in someone over 50 with vascular risk factors.",
      "Keeping a simple **headache diary** (timing, foods, sleep, menstrual cycle, medicines) helps clinicians tailor prevention and treatment.",
    ]),
  },
  {
    keywords: ["stomach", "nausea", "vomiting", "diarrhea", "abdominal pain", "belly"],
    response: topicArticle("Nausea, vomiting, and diarrhea", [
      "These symptoms are often caused by **viral gastroenteritis**, **food-related illness**, medication effects, or other gut conditions. **Hydration** is central: small frequent sips of water or **oral rehydration solutions** are often better than only plain water when losses are heavy.",
      "Seek care for **blood** in vomit or stool, **severe or constant abdominal pain**, **high fever**, **signs of dehydration** (very dry mouth, minimal urine, dizziness), or if you **cannot keep fluids down for many hours**—especially in **young children** and **older adults**.",
      "Antidiarrheal medicines are **not always appropriate**—ask a clinician if you have fever, blood, or suspected invasive infection.",
    ]),
  },
  {
    keywords: ["chest pain", "chest tightness", "chest pressure", "heart pain", "palpitation"],
    priority: 10,
    response: topicArticle("Chest pain and pressure", [
      "⚠️ **Chest discomfort** can come from the heart, lungs, esophagus, muscles, or anxiety—but **some causes are immediately dangerous**. **Pressure-like pain** with sweating, nausea, or pain in the **jaw or arm** can signal a **heart attack**; **sudden sharp pain with breathlessness** can signal a **lung clot** or **collapsed lung**.",
      "**Call emergency services** for severe, unexplained, or worsening chest pain, especially with shortness of breath, fainting, or a racing irregular heartbeat. Do not assume it is “only anxiety” without appropriate evaluation when red flags are present.",
      "If you already have **known heart disease** and symptoms feel like prior angina, follow your **action plan**; if symptoms are stronger or longer than usual, treat that as urgent.",
    ]),
  },
  {
    keywords: ["breathing", "shortness of breath", "asthma", "wheeze", "inhaler", "breathless"],
    response: topicArticle("Shortness of breath and wheeze", [
      "Trouble breathing can reflect **asthma**, **infections**, **blood clots**, **heart failure**, **anemia**, **anxiety**, and other conditions. **Wheezing** often points to narrowed airways, but not everyone with serious lung problems wheezes audibly.",
      "Use your **prescribed rescue inhaler** as directed in your asthma plan while arranging care if symptoms are moderate or severe. Seek **emergency care** for **blue-tinged lips or nails**, **inability to speak full sentences**, **silent chest** in asthma, or **sudden breathlessness** with chest pain.",
      "Smoking cessation and up-to-date **flu and pneumococcal vaccination** (where indicated) reduce serious respiratory complications.",
    ]),
  },
  {
    keywords: ["anxiety", "anxious", "panic", "worry", "nervous", "overwhelmed"],
    response: topicArticle("Anxiety and worry", [
      "**Anxiety** is common and treatable. Skills such as **slow breathing**, **grounding**, **sleep regularity**, and **reducing caffeine** help some people day to day. **Cognitive behavioral therapy (CBT)** has strong evidence for several anxiety disorders.",
      "Seek **urgent help** if you have **thoughts of harming yourself**, feel **out of control of panic**, or cannot care for basic needs. In the United States, **988** offers crisis support; other regions have their own hotlines.",
      "Medications can help, but they should be chosen and monitored by a **licensed clinician** who knows your full history.",
    ]),
  },
  {
    keywords: ["depression", "depressed", "sad", "hopeless", "no motivation", "worthless", "low mood"],
    response: topicArticle("Low mood and depression", [
      "**Depression** is a medical condition involving mood, energy, sleep, appetite, concentration, and sometimes physical pain—not a personal failure. Effective options include **therapy**, **medications**, and **structured lifestyle supports**; many people use a combination.",
      "Seek **immediate help** for **suicidal thoughts**, a **plan**, or **self-harm**. Treat **sleep deprivation**, **substance use**, and **medical illnesses** that mimic depression as part of a full evaluation.",
      "Recovery is gradual; tracking small improvements week to week can be encouraging while treatment is adjusted.",
    ]),
  },
  {
    keywords: ["sleep", "insomnia", "can't sleep", "tired", "fatigue", "exhausted"],
    response: topicArticle("Sleep problems and fatigue", [
      "**Sleep hygiene**—regular schedule, dark cool bedroom, limiting late caffeine and alcohol, and reducing late-night screens—helps many people. **Fatigue** can also come from **thyroid disease**, **anemia**, **sleep apnea**, **depression**, **medications**, and many other causes.",
      "See a clinician if insomnia lasts **weeks to months**, if you **fall asleep in dangerous situations**, if you have **loud snoring with daytime sleepiness**, or if fatigue is **unexplained** and affecting work or safety.",
      "Sleep tracking on a phone can help, but avoid obsessive clock-watching in bed.",
    ]),
  },
  {
    keywords: ["vaccine", "vaccination", "immunization", "shot", "booster"],
    response: topicArticle("Vaccination basics", [
      "Vaccines train the immune system using **safe, tested approaches**; schedules differ by **age**, **health conditions**, **occupation**, **travel**, and **local disease patterns**. Examples adults often discuss include **influenza**, **Tdap**, **COVID-19**, **shingles**, and **pneumococcal** vaccines—eligibility varies.",
      "Ask your clinician or pharmacist about **timing**, **boosters**, and **contraindications** (for example, certain allergies or immune conditions). Pregnancy and childhood schedules have **specific rules**—follow your national program.",
      "Mild sore arm or low-grade fever can occur; **severe allergic reactions** are uncommon but should be managed urgently.",
    ]),
  },
  {
    keywords: ["medication", "medicine", "drug", "pill", "dose", "prescription", "side effect"],
    response: topicArticle("Using medicines safely", [
      "Take prescription medicines **exactly as directed**, and finish antibiotics **only when prescribed** for bacterial infections. **Pharmacists** are excellent resources for **interactions**, **timing with food**, and **over-the-counter combinations**.",
      "Be cautious with **NSAIDs** if you have kidney disease, ulcers, or are on blood thinners; be cautious with **acetaminophen** if you have liver disease. **Herbal supplements** can interact with prescriptions—disclose everything you take.",
      "If a new symptom starts hours to days after a new drug, consider **possible adverse effects** and contact your prescriber.",
    ]),
  },
  {
    keywords: ["allergy", "allergic", "hives", "itching", "anaphylaxis", "epipen"],
    response: topicArticle("Allergies and severe reactions", [
      "Mild **allergic rhinitis** or **hives** may respond to **antihistamines** and avoidance of triggers. **Anaphylaxis** is a **systemic emergency** with throat tightness, wheeze, widespread hives, vomiting, or collapse—**use epinephrine** if prescribed and **call emergency services**.",
      "People with **food or venom allergies** should carry **two** epinephrine auto-injectors when advised, and teach family how to use them.",
      "Allergy testing and immunotherapy plans should be directed by **allergy specialists** when appropriate.",
    ]),
  },
  {
    keywords: ["diabetes", "blood sugar", "insulin", "glucose", "diabetic"],
    response: topicArticle("Diabetes — big-picture care", [
      "Diabetes care balances **nutrition**, **physical activity**, **glucose monitoring**, and **medications** tailored to type and stage. Long-term goals include protecting **eyes**, **kidneys**, **nerves**, and **blood vessels** through blood pressure and lipid management—not only glucose numbers.",
      "Know **hypoglycemia** symptoms (shakiness, sweating, confusion) and your **sick-day plan**. Seek urgent care for **very high sugars with vomiting**, **fruity breath**, or **confusion** (possible DKA/HHS).",
      "Foot daily checks and routine **dilated eye exams** matter even when you feel well.",
    ]),
  },
  {
    keywords: ["blood pressure", "hypertension", "high blood pressure", "bp"],
    response: topicArticle("Blood pressure and hypertension", [
      "**Blood pressure** naturally varies through the day; diagnosis usually relies on **repeated measurements** in clinic or **home monitoring**. Lifestyle approaches include **DASH-style eating**, **sodium reduction**, **regular activity**, **weight management**, and **moderate alcohol**.",
      "Untreated hypertension raises risks of **stroke**, **heart attack**, **heart failure**, **kidney disease**, and **vision loss**. Medications are common and often **combined**—do not stop abruptly without medical advice.",
      "Seek urgent care for **very high readings with chest pain, neurologic symptoms, or severe headache**.",
    ]),
  },
  {
    keywords: ["stroke", "facial drooping", "arm weakness", "speech difficulty", "FAST"],
    priority: 10,
    response: topicArticle("Stroke warning signs (FAST)", [
      "⚠️ **FAST** is a memory aid: **Face** drooping, **Arm** weakness on one side, **Speech** difficulty, **Time** to call emergency services immediately. **Every minute** matters for possible clot-busting or procedural treatments when appropriate.",
      "Other warning signs include **sudden severe headache**, **vision loss in one or both eyes**, **trouble walking**, or **confusion**. Do not wait to see if it passes.",
      "Note the **time last known well**—hospitals will ask.",
    ]),
  },
  {
    keywords: ["mental health", "therapy", "counseling", "psychiatrist", "psychologist"],
    response: topicArticle("Finding mental health support", [
      "**Therapists**, **psychologists**, **psychiatrists**, and **primary care** clinicians often coordinate care. **CBT** and certain other therapies have strong evidence for common conditions; **medications** can help moderate-to-severe symptoms when prescribed thoughtfully.",
      "Insurance directories, **employee assistance programs**, **community mental health centers**, and **telehealth** can improve access. If wait times are long, ask about **group therapy** or **skills classes** as bridges.",
      "Cultural fit with a therapist matters—it's okay to **try more than one** clinician.",
    ]),
  },
];

const raw = rawData as RawRow[];

const EXTRA: KnowledgeSeedRow[] = raw.map((row) => ({
  keywords: row.kw,
  response: topicArticle(titleFromKw(row.kw), [row.text]),
}));

/** Full catalog for MongoDB + offline fallback */
export const KNOWLEDGE_SEED_ENTRIES: KnowledgeSeedRow[] = [...CORE, ...EXTRA];

/** Alias for older imports / tooling */
export const STATIC_HEALTH_KNOWLEDGE: KnowledgeSeedRow[] =
  KNOWLEDGE_SEED_ENTRIES;
