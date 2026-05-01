// Seed lesson + question content for SAT Quest v1.
// Two sections, each with one themed world of 5 lesson nodes + 1 boss checkpoint.

export type Section = "rw" | "math";

export interface Question {
  id: string;
  prompt: string;
  passage?: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number; // 800-1600 implied rating
  skillId: string;
}

export interface Lesson {
  intro: string;
  example: string;
  tip: string;
}

export interface Node {
  id: string;
  title: string;
  skillId: string;
  lesson: Lesson;
  questions: Question[];
}

export interface World {
  id: string;
  section: Section;
  name: string;
  emoji: string;
  tagline: string;
  nodes: Node[];
  bossId: string;
  bossTitle: string;
  bossQuestionIds: string[]; // sampled from world for the checkpoint
}

export interface Skill {
  id: string;
  name: string;
  section: Section;
}

export const SKILLS: Skill[] = [
  // R&W
  { id: "subj-verb", name: "Subject–Verb Agreement", section: "rw" },
  { id: "punctuation", name: "Commas & Semicolons", section: "rw" },
  { id: "transitions", name: "Transitions", section: "rw" },
  { id: "evidence", name: "Command of Evidence", section: "rw" },
  { id: "vocab-context", name: "Words in Context", section: "rw" },
  // Math
  { id: "linear-eq", name: "Linear Equations", section: "math" },
  { id: "systems", name: "Systems of Equations", section: "math" },
  { id: "ratios", name: "Ratios & Percents", section: "math" },
  { id: "quadratics", name: "Quadratics", section: "math" },
  { id: "stats", name: "Stats & Data", section: "math" },
];

const rwNodes: Node[] = [
  {
    id: "rw-1",
    title: "Subject–Verb Agreement",
    skillId: "subj-verb",
    lesson: {
      intro: "Verbs must match their subject in number. A singular subject takes a singular verb; a plural subject takes a plural verb.",
      example: "The box of cookies *is* on the counter. ('Box' is the subject — singular — not 'cookies'.)",
      tip: "Cross out prepositional phrases between the subject and the verb to find the real subject.",
    },
    questions: [
      {
        id: "rw-1-q1",
        prompt: "Choose the correct verb: The collection of rare coins ____ displayed in the museum lobby.",
        choices: ["are", "is", "were", "have been"],
        correctIndex: 1,
        explanation: "'Collection' is the singular subject. 'Of rare coins' is a prepositional phrase.",
        difficulty: 1100,
        skillId: "subj-verb",
      },
      {
        id: "rw-1-q2",
        prompt: "Each of the students ____ responsible for their own materials.",
        choices: ["are", "is", "be", "have"],
        correctIndex: 1,
        explanation: "'Each' is singular and takes a singular verb.",
        difficulty: 1200,
        skillId: "subj-verb",
      },
      {
        id: "rw-1-q3",
        prompt: "Neither the captain nor the players ____ ready for the storm.",
        choices: ["was", "is", "were", "has been"],
        correctIndex: 2,
        explanation: "With 'neither/nor', the verb agrees with the noun closest to it — here, 'players' (plural).",
        difficulty: 1300,
        skillId: "subj-verb",
      },
    ],
  },
  {
    id: "rw-2",
    title: "Commas & Semicolons",
    skillId: "punctuation",
    lesson: {
      intro: "Use a semicolon to join two independent clauses. Use a comma plus a coordinating conjunction (FANBOYS) to do the same job.",
      example: "I love SAT prep; it makes me feel powerful. — OR — I love SAT prep, and it makes me feel powerful.",
      tip: "Never join two independent clauses with just a comma — that's a comma splice.",
    },
    questions: [
      {
        id: "rw-2-q1",
        prompt: "Which version is punctuated correctly?",
        choices: [
          "She studied for hours, she aced the test.",
          "She studied for hours; she aced the test.",
          "She studied for hours she aced the test.",
          "She studied; for hours, she aced the test.",
        ],
        correctIndex: 1,
        explanation: "Two independent clauses can be joined by a semicolon.",
        difficulty: 1100,
        skillId: "punctuation",
      },
      {
        id: "rw-2-q2",
        prompt: "Pick the best punctuation: 'After the rain stopped ____ we went outside.'",
        choices: [", ", "; ", " ", " — "],
        correctIndex: 0,
        explanation: "A comma follows an introductory dependent clause.",
        difficulty: 1150,
        skillId: "punctuation",
      },
      {
        id: "rw-2-q3",
        prompt: "Which sentence has NO error?",
        choices: [
          "I packed three things, a tent, a map, and snacks.",
          "I packed three things: a tent, a map, and snacks.",
          "I packed three things; a tent, a map, and snacks.",
          "I packed three things — a tent a map and snacks.",
        ],
        correctIndex: 1,
        explanation: "Use a colon to introduce a list after an independent clause.",
        difficulty: 1250,
        skillId: "punctuation",
      },
    ],
  },
  {
    id: "rw-3",
    title: "Transitions",
    skillId: "transitions",
    lesson: {
      intro: "Transitions show the relationship between ideas: contrast, cause/effect, addition, sequence.",
      example: "She trained hard; *therefore*, she won. (cause/effect) — She trained hard; *however*, she lost. (contrast)",
      tip: "Read both sentences and ask: agree, disagree, or add? Then pick the matching transition.",
    },
    questions: [
      {
        id: "rw-3-q1",
        prompt: "The lab ran out of funding. ____, the team kept working unpaid for months.",
        choices: ["Therefore", "Nevertheless", "Likewise", "For example"],
        correctIndex: 1,
        explanation: "The two ideas contrast — 'nevertheless' shows that contrast.",
        difficulty: 1200,
        skillId: "transitions",
      },
      {
        id: "rw-3-q2",
        prompt: "Maya practiced daily. ____, her brother trained only on weekends.",
        choices: ["In contrast", "As a result", "Furthermore", "Specifically"],
        correctIndex: 0,
        explanation: "The two siblings' habits are being contrasted.",
        difficulty: 1150,
        skillId: "transitions",
      },
      {
        id: "rw-3-q3",
        prompt: "The bridge had three flaws. ____, the steel was already rusting.",
        choices: ["However", "Moreover", "Otherwise", "Conversely"],
        correctIndex: 1,
        explanation: "'Moreover' adds another point in the same direction.",
        difficulty: 1300,
        skillId: "transitions",
      },
    ],
  },
  {
    id: "rw-4",
    title: "Command of Evidence",
    skillId: "evidence",
    lesson: {
      intro: "Pick the choice that most directly supports the claim — not just a related fact.",
      example: "Claim: 'Bees navigate using polarized light.' Best evidence: a study showing bees lose direction under filters that block polarization.",
      tip: "Cross out choices that are true but off-topic. Match the evidence to the exact claim.",
    },
    questions: [
      {
        id: "rw-4-q1",
        passage: "Researchers claim that urban gardens reduce neighborhood stress. Which finding best supports this claim?",
        prompt: "Which choice best supports the researchers' claim?",
        choices: [
          "Urban gardens contain a wide variety of plant species.",
          "Residents within two blocks of a garden reported 28% lower stress scores.",
          "City budgets for parks have grown over the past decade.",
          "Many gardens are maintained by volunteers.",
        ],
        correctIndex: 1,
        explanation: "Only choice B directly links gardens to lower stress.",
        difficulty: 1250,
        skillId: "evidence",
      },
      {
        id: "rw-4-q2",
        passage: "A historian argues that early printing presses spread literacy faster than any prior invention.",
        prompt: "Which evidence most directly supports the argument?",
        choices: [
          "Printing presses required skilled labor to operate.",
          "Literacy rates in cities with presses doubled within 50 years.",
          "Many early printers also bound books.",
          "Hand-copied manuscripts were expensive.",
        ],
        correctIndex: 1,
        explanation: "B ties the press directly to a measurable rise in literacy.",
        difficulty: 1300,
        skillId: "evidence",
      },
      {
        id: "rw-4-q3",
        passage: "A biologist hypothesizes that nocturnal foxes hunt more efficiently during full moons.",
        prompt: "Which finding best supports this hypothesis?",
        choices: [
          "Foxes adjust their dens seasonally.",
          "Full-moon nights tend to be cooler than other nights.",
          "Cameras recorded 40% more successful kills on full-moon nights.",
          "Foxes have excellent hearing.",
        ],
        correctIndex: 2,
        explanation: "C directly links full moons to hunting success.",
        difficulty: 1350,
        skillId: "evidence",
      },
    ],
  },
  {
    id: "rw-5",
    title: "Words in Context",
    skillId: "vocab-context",
    lesson: {
      intro: "Pick the word whose meaning fits the sentence's tone, intent, and surrounding clues.",
      example: "Her *measured* response calmed the room. ('Measured' = careful, restrained — fits the calming tone.)",
      tip: "Plug each option in mentally. Eliminate words that are too strong, too weak, or off-tone.",
    },
    questions: [
      {
        id: "rw-5-q1",
        prompt: "The senator gave a ____ apology — brief, vague, and clearly forced.",
        choices: ["heartfelt", "perfunctory", "exuberant", "meticulous"],
        correctIndex: 1,
        explanation: "'Perfunctory' means done with minimum effort — matches 'brief, vague, forced'.",
        difficulty: 1300,
        skillId: "vocab-context",
      },
      {
        id: "rw-5-q2",
        prompt: "Despite the chaos, her demeanor remained ____.",
        choices: ["frantic", "composed", "irate", "evasive"],
        correctIndex: 1,
        explanation: "'Despite the chaos' signals contrast — composed fits.",
        difficulty: 1150,
        skillId: "vocab-context",
      },
      {
        id: "rw-5-q3",
        prompt: "The critic praised the novel's ____ prose — rich, layered, and slow to reveal its secrets.",
        choices: ["sparse", "dense", "blunt", "trite"],
        correctIndex: 1,
        explanation: "'Rich, layered' matches 'dense' (in the literary sense).",
        difficulty: 1400,
        skillId: "vocab-context",
      },
    ],
  },
];

const mathNodes: Node[] = [
  {
    id: "math-1",
    title: "Linear Equations",
    skillId: "linear-eq",
    lesson: {
      intro: "A linear equation has the form y = mx + b. m is the slope (rise/run), b is the y-intercept.",
      example: "If y = 2x + 3, the line crosses the y-axis at 3 and rises 2 for every 1 step right.",
      tip: "Two points (x₁,y₁) and (x₂,y₂) give slope m = (y₂ − y₁) / (x₂ − x₁).",
    },
    questions: [
      {
        id: "math-1-q1",
        prompt: "What is the slope of the line through (1, 2) and (4, 11)?",
        choices: ["2", "3", "4", "9"],
        correctIndex: 1,
        explanation: "(11 − 2) / (4 − 1) = 9/3 = 3.",
        difficulty: 1100,
        skillId: "linear-eq",
      },
      {
        id: "math-1-q2",
        prompt: "If 3x − 5 = 16, what is x?",
        choices: ["3", "5", "7", "9"],
        correctIndex: 2,
        explanation: "3x = 21, so x = 7.",
        difficulty: 1000,
        skillId: "linear-eq",
      },
      {
        id: "math-1-q3",
        prompt: "Line y = -2x + 5 crosses the x-axis at x = ?",
        choices: ["2.5", "-2.5", "5", "-5"],
        correctIndex: 0,
        explanation: "Set y = 0: 0 = -2x + 5 → x = 2.5.",
        difficulty: 1200,
        skillId: "linear-eq",
      },
    ],
  },
  {
    id: "math-2",
    title: "Systems of Equations",
    skillId: "systems",
    lesson: {
      intro: "A system has two equations with two unknowns. Solve by substitution or elimination.",
      example: "x + y = 10 and x − y = 2. Add them: 2x = 12 → x = 6, y = 4.",
      tip: "Look for a variable that's already isolated or has matching coefficients — that's your shortcut.",
    },
    questions: [
      {
        id: "math-2-q1",
        prompt: "If x + y = 8 and x − y = 2, what is x?",
        choices: ["3", "4", "5", "6"],
        correctIndex: 2,
        explanation: "Add: 2x = 10 → x = 5.",
        difficulty: 1050,
        skillId: "systems",
      },
      {
        id: "math-2-q2",
        prompt: "If 2x + 3y = 12 and x = 3, what is y?",
        choices: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "6 + 3y = 12 → 3y = 6 → y = 2.",
        difficulty: 1100,
        skillId: "systems",
      },
      {
        id: "math-2-q3",
        prompt: "How many solutions does the system y = 2x + 1 and y = 2x − 4 have?",
        choices: ["0", "1", "2", "Infinitely many"],
        correctIndex: 0,
        explanation: "Same slope, different intercepts → parallel lines, no solution.",
        difficulty: 1250,
        skillId: "systems",
      },
    ],
  },
  {
    id: "math-3",
    title: "Ratios & Percents",
    skillId: "ratios",
    lesson: {
      intro: "A ratio compares two quantities. A percent is a ratio out of 100.",
      example: "If 30 of 120 students walk to school, that's 30/120 = 25%.",
      tip: "For 'percent of', multiply: 20% of 80 = 0.20 × 80 = 16.",
    },
    questions: [
      {
        id: "math-3-q1",
        prompt: "What is 15% of 240?",
        choices: ["24", "30", "36", "48"],
        correctIndex: 2,
        explanation: "0.15 × 240 = 36.",
        difficulty: 1050,
        skillId: "ratios",
      },
      {
        id: "math-3-q2",
        prompt: "A shirt costs $40 after a 20% discount. What was the original price?",
        choices: ["$48", "$50", "$52", "$60"],
        correctIndex: 1,
        explanation: "$40 = 0.80 × original → original = $50.",
        difficulty: 1200,
        skillId: "ratios",
      },
      {
        id: "math-3-q3",
        prompt: "A recipe uses sugar to flour in a 2:5 ratio. If you use 10 cups of flour, how much sugar?",
        choices: ["2", "3", "4", "5"],
        correctIndex: 2,
        explanation: "2/5 = x/10 → x = 4.",
        difficulty: 1100,
        skillId: "ratios",
      },
    ],
  },
  {
    id: "math-4",
    title: "Quadratics",
    skillId: "quadratics",
    lesson: {
      intro: "A quadratic has the form ax² + bx + c. It graphs as a parabola.",
      example: "x² − 5x + 6 = (x − 2)(x − 3), so roots are x = 2 and x = 3.",
      tip: "Factor when possible. Use the quadratic formula when factoring fails.",
    },
    questions: [
      {
        id: "math-4-q1",
        prompt: "What are the solutions of x² − 7x + 12 = 0?",
        choices: ["3 and 4", "2 and 6", "−3 and −4", "1 and 12"],
        correctIndex: 0,
        explanation: "(x − 3)(x − 4) = 0.",
        difficulty: 1150,
        skillId: "quadratics",
      },
      {
        id: "math-4-q2",
        prompt: "The vertex of y = (x − 2)² + 3 is at:",
        choices: ["(2, 3)", "(-2, 3)", "(2, -3)", "(3, 2)"],
        correctIndex: 0,
        explanation: "Vertex form gives vertex (h, k) = (2, 3).",
        difficulty: 1250,
        skillId: "quadratics",
      },
      {
        id: "math-4-q3",
        prompt: "If x² = 49, what are all solutions for x?",
        choices: ["7", "−7", "7 and −7", "0 and 7"],
        correctIndex: 2,
        explanation: "Both 7² and (−7)² equal 49.",
        difficulty: 1050,
        skillId: "quadratics",
      },
    ],
  },
  {
    id: "math-5",
    title: "Stats & Data",
    skillId: "stats",
    lesson: {
      intro: "Mean = sum ÷ count. Median = middle value when sorted. Mode = most common.",
      example: "For {2, 4, 4, 6, 9}: mean = 5, median = 4, mode = 4.",
      tip: "Outliers pull the mean but barely move the median.",
    },
    questions: [
      {
        id: "math-5-q1",
        prompt: "What is the median of {3, 8, 1, 6, 4}?",
        choices: ["3", "4", "5", "6"],
        correctIndex: 1,
        explanation: "Sorted: 1, 3, 4, 6, 8 → middle is 4.",
        difficulty: 1050,
        skillId: "stats",
      },
      {
        id: "math-5-q2",
        prompt: "The mean of five numbers is 12. Their sum is:",
        choices: ["12", "17", "60", "120"],
        correctIndex: 2,
        explanation: "Mean × count = 12 × 5 = 60.",
        difficulty: 1100,
        skillId: "stats",
      },
      {
        id: "math-5-q3",
        prompt: "Adding which value to {2, 4, 6} would NOT change the median?",
        choices: ["1", "4", "10", "100"],
        correctIndex: 1,
        explanation: "Adding 4 keeps the middle at 4. Other values shift the median.",
        difficulty: 1300,
        skillId: "stats",
      },
    ],
  },
];

export const WORLDS: World[] = [
  {
    id: "grammar-grove",
    section: "rw",
    name: "Grammar Grove",
    emoji: "🌳",
    tagline: "Master the rules that hide in plain sight.",
    nodes: rwNodes,
    bossId: "rw-boss-1",
    bossTitle: "Grove Guardian",
    bossQuestionIds: ["rw-1-q3", "rw-2-q3", "rw-3-q3", "rw-4-q3", "rw-5-q3"],
  },
  {
    id: "algebra-atoll",
    section: "math",
    name: "Algebra Atoll",
    emoji: "🏝️",
    tagline: "Sail through equations and surface with answers.",
    nodes: mathNodes,
    bossId: "math-boss-1",
    bossTitle: "Atoll Sentinel",
    bossQuestionIds: ["math-1-q3", "math-2-q3", "math-3-q3", "math-4-q3", "math-5-q3"],
  },
];

export function getNode(nodeId: string): { node: Node; world: World } | null {
  for (const w of WORLDS) {
    const node = w.nodes.find((n) => n.id === nodeId);
    if (node) return { node, world: w };
  }
  return null;
}

export function getWorldBySection(section: Section): World {
  return WORLDS.find((w) => w.section === section)!;
}

export function getSkill(skillId: string): Skill | undefined {
  return SKILLS.find((s) => s.id === skillId);
}

export function getAllQuestionsForBoss(world: World): Question[] {
  const ids = new Set(world.bossQuestionIds);
  const all: Question[] = [];
  for (const n of world.nodes) for (const q of n.questions) if (ids.has(q.id)) all.push(q);
  return all;
}
