
ALTER TABLE public.questions DROP COLUMN IF EXISTS skill;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ai_generated';

CREATE TABLE public.daily_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  set_date date NOT NULL,
  slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 5),
  question_id text NOT NULL,
  shuffled_order text[] NOT NULL,
  correct_position smallint NOT NULL CHECK (correct_position BETWEEN 0 AND 3),
  selected_position smallint,
  is_correct boolean,
  elapsed_ms integer,
  served_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, set_date, slot)
);

GRANT SELECT, INSERT, UPDATE ON public.daily_attempts TO authenticated;
GRANT ALL ON public.daily_attempts TO service_role;

ALTER TABLE public.daily_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily attempts"
  ON public.daily_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily attempts"
  ON public.daily_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily attempts"
  ON public.daily_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_daily_attempts_updated_at
  BEFORE UPDATE ON public.daily_attempts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_daily_attempts_user_date ON public.daily_attempts (user_id, set_date);
