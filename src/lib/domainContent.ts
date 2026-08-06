// Static descriptive content for each SAT domain, shown in DomainInfoModal.
// Pure content, no scoring or tier logic. Keys match the `id` field in
// the DOMAINS array in freeUser.ts.

export interface DomainContent {
  description: string;
  questionTypes: string;
  tips: [string, string, string];
}

export const DOMAIN_CONTENT: Record<string, DomainContent> = {
  "math-algebra": {
    description:
      "Linear equations, linear inequalities, and systems of linear equations, both in one variable and two. This is the largest single math domain on the SAT, and it shows up constantly as a building block inside word problems from other domains too.",
    questionTypes:
      "Solving for a variable, interpreting what a slope or intercept means in context, and systems of two linear equations solved algebraically or graphically.",
    tips: [
      "When a word problem gives you two unknowns, write both equations before you solve either one. Don't try to shortcut it in your head.",
      "If a question describes a line in words (\"a rate of $5 per hour plus a $20 fee\"), translate it to slope-intercept form immediately.",
      "For systems questions, check if elimination is faster than substitution before you start. It usually is when coefficients already line up.",
    ],
  },
  "math-advanced": {
    description:
      "Nonlinear expressions and equations: quadratics, exponentials, polynomials, and rational expressions. This domain tests whether you can manipulate more complex algebraic structures, not just solve for x in a straight line.",
    questionTypes:
      "Factoring and solving quadratics, working with exponent rules, simplifying rational expressions, and interpreting nonlinear function behavior.",
    tips: [
      "Before grinding through the quadratic formula, check if the expression factors cleanly. It often does on this test.",
      "Memorize the exponent rules cold (product, quotient, power of a power). These show up as quick sub-steps inside bigger problems.",
      "When a question shows a graph of a nonlinear function, read the vertex, roots, or end behavior directly off the graph before touching algebra.",
    ],
  },
  "math-data": {
    description:
      "Ratios, rates, percentages, and interpreting data from tables, scatterplots, and two-way tables. This domain is less about advanced math and more about careful reading; most mistakes here come from misreading the data, not miscalculating it.",
    questionTypes:
      "Percent change and ratio problems, reading values off scatterplots or tables, probability from two-way tables, and evaluating statistical claims.",
    tips: [
      "Underline exactly what unit or category the question is asking about before you touch the table. Misreading the row or column is the most common error here.",
      "For percent problems, always identify what the percent is 'of' first. That's usually where points are lost.",
      "On scatterplot questions, eyeball the trend line before calculating anything. It'll catch you if your answer is way off.",
    ],
  },
  "math-geo": {
    description:
      "Area, volume, angles, triangle properties, circles, and right-triangle trigonometry. The smallest of the four math domains by question count, but it leans on memorized formulas more than any other.",
    questionTypes:
      "Area and volume calculations, angle relationships in triangles and circles, and basic trig ratios (sine, cosine, tangent) in right triangles.",
    tips: [
      "The reference sheet at the start of the math section has most geometry formulas printed on it. Know it's there and use it instead of re-deriving from memory.",
      "For circle problems, convert between degrees and radians carefully. This is a common silent error.",
      "In right-triangle trig questions, sketch the triangle and label the sides (opposite/adjacent/hypotenuse) before picking a ratio.",
    ],
  },
  "rw-info": {
    description:
      "Reading comprehension focused on central ideas, supporting details, and using evidence from text or informational graphics. Passages are short, usually one paragraph, so precision matters more than speed-reading.",
    questionTypes:
      "Main idea questions, 'which choice provides the best evidence' questions, and questions that pair a short passage with a chart or graph.",
    tips: [
      "Read the question before the passage when possible. Knowing what you're looking for changes how you read.",
      "For evidence questions, treat it as a two-part problem: find the claim first, then find the exact line that proves it. Don't pick an answer that merely sounds relevant.",
      "When a graphic is paired with the passage, check that your answer matches the graphic and the text. Wrong answers often satisfy only one of the two.",
    ],
  },
  "rw-craft": {
    description:
      "Word choice, text structure, cross-text connections, and the purpose behind an author's rhetorical choices. This domain asks not just what a passage says, but why it's written the way it is.",
    questionTypes:
      "Vocabulary-in-context questions, questions about how a paragraph or sentence functions in the passage, and paired-passage comparison questions.",
    tips: [
      "For vocabulary-in-context, cover the answer choices and predict the word yourself first. The SAT's wrong answers are designed to sound plausible in isolation.",
      "When asked about a sentence's function, describe its job in your own words (e.g. 'introduces a counterargument') before scanning the choices.",
      "On paired-passage questions, nail down each passage's main point separately before comparing them. Don't try to hold both in your head at once.",
    ],
  },
  "rw-expr": {
    description:
      "Revising text for clarity, conciseness, and logical flow, including choosing the best transition word and combining or reordering sentences effectively. This is editing, not grammar rules.",
    questionTypes:
      "Choosing the best transition (however, therefore, in addition), selecting the most logical sentence order, and identifying the most concise phrasing.",
    tips: [
      "For transition questions, identify the logical relationship between the two ideas first (contrast, cause-effect, addition), then match the word to that relationship.",
      "When choices differ mainly in length, the shortest option that preserves the full meaning is usually correct. This test rewards concision.",
      "Read the sentence before and after the blank, not just the sentence containing it. Flow questions depend on context outside the target sentence.",
    ],
  },
  "rw-conv": {
    description:
      "Standard grammar and usage rules: subject-verb agreement, punctuation, sentence boundaries, and pronoun clarity. Unlike the other R&W domains, this one has clear right answers governed by fixed rules.",
    questionTypes:
      "Comma and semicolon usage, sentence fragments and run-ons, subject-verb and pronoun-antecedent agreement, and apostrophe usage (its vs. it's, plural vs. possessive).",
    tips: [
      "Read the sentence in your head exactly as written with each answer choice plugged in. Grammar errors are often easier to hear than to spot on the page.",
      "For comma questions, check whether the clause on either side could stand alone as a full sentence. That determines whether you need a comma, semicolon, or nothing.",
      "Don't assume the longest or most 'formal-sounding' choice is correct. Standard English Conventions rewards the grammatically correct choice, not the fanciest one.",
    ],
  },
};
