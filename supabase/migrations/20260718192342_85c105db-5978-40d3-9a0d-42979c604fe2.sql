CREATE TABLE public.question_reports (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  slot INTEGER,
  reason TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX question_reports_user_id_created_at_idx ON public.question_reports (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.question_reports TO authenticated;
GRANT ALL ON public.question_reports TO service_role;

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON public.question_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON public.question_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
