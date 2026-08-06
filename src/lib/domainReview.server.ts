// Hydration helpers for review payloads (question text, choices, positions).
export interface DomainReviewItem {
  questionId: string;
  domainLabel: string;
  passage?: string;
  question: string;
  choices: string[];
  correctPosition: number;
  selectedPosition: number;
}

const LETTERS = ["A", "B", "C", "D"];

export function buildReviewMap(
  ids: string[],
  questions: any[] | null,
  attempts: any[] | null,
  domainLabel: string,
): Map<string, DomainReviewItem> {
  const attemptByQ = new Map<string, any>();
  for (const a of attempts ?? []) attemptByQ.set(a.question_id, a);

  const out = new Map<string, DomainReviewItem>();

  for (const id of ids) {
    const row = (questions ?? []).find((q: any) => q.id === id);
    if (!row) continue;
    const p: any = row.payload ?? {};

    // Dual payload shape: { question, choices: {A..D}, correct } or
    // { prompt, choices: [..4], correctIndex }.
    let prompt: string;
    let base: string[] = [];
    let correctIndex = -1;
    if (typeof p.question === "string" && p.choices && !Array.isArray(p.choices)) {
      prompt = p.question;
      const c = p.choices as Record<string, string>;
      base = [c.A, c.B, c.C, c.D].filter((x) => typeof x === "string");
      correctIndex = LETTERS.indexOf(String(p.correct ?? "").toUpperCase());
    } else {
      prompt = String(p.prompt ?? "");
      base = Array.isArray(p.choices) ? p.choices.map(String) : [];
      correctIndex = Number(p.correctIndex);
    }
    if (base.length !== 4 || correctIndex < 0) continue;

    const passage = typeof p.passage === "string" ? p.passage : undefined;
    const attempt = attemptByQ.get(id);

    if (attempt?.shuffled_order?.length === 4) {
      const order: string[] = attempt.shuffled_order;
      out.set(id, {
        questionId: id,
        domainLabel,
        passage,
        question: prompt,
        choices: order.map((l) => base[LETTERS.indexOf(l)]),
        correctPosition: attempt.correct_position ?? order.indexOf(LETTERS[correctIndex]),
        selectedPosition: attempt.selected_position ?? -1,
      });
    } else {
      out.set(id, {
        questionId: id,
        domainLabel,
        passage,
        question: prompt,
        choices: base,
        correctPosition: correctIndex,
        selectedPosition: -1,
      });
    }
  }

  return out;
}
