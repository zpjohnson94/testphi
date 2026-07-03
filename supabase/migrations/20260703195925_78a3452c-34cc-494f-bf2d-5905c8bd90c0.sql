
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS passage_group_id uuid,
  ADD COLUMN IF NOT EXISTS diagram_group_id uuid,
  ADD COLUMN IF NOT EXISTS skill text;

CREATE INDEX IF NOT EXISTS questions_active_domain_diff_idx
  ON public.questions (domain_id, difficulty) WHERE is_active;
CREATE INDEX IF NOT EXISTS questions_passage_group_idx
  ON public.questions (passage_group_id) WHERE passage_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS questions_diagram_group_idx
  ON public.questions (diagram_group_id) WHERE diagram_group_id IS NOT NULL;

COMMENT ON COLUMN public.questions.payload IS
  'Frozen shape: { prompt, choices[4], correctIndex, skill, passage_group_id, diagram_group_id }. No correct/incorrectWeight — derived at answer-time from difficulty + mastery.';

CREATE TABLE IF NOT EXISTS public.daily_sets (
  set_date date PRIMARY KEY,
  question_ids text[] NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_sets_five_questions CHECK (array_length(question_ids, 1) = 5)
);

GRANT SELECT ON public.daily_sets TO authenticated;
GRANT ALL ON public.daily_sets TO service_role;

ALTER TABLE public.daily_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read daily sets"
  ON public.daily_sets FOR SELECT TO authenticated USING (true);
