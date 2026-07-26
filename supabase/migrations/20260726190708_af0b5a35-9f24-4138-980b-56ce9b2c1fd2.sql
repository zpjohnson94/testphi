
CREATE TABLE public.battle_sets (
  set_date DATE PRIMARY KEY,
  question_ids TEXT[] NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.battle_sets TO authenticated;
GRANT ALL ON public.battle_sets TO service_role;
ALTER TABLE public.battle_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read battle_sets" ON public.battle_sets
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.battle_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  battle_date DATE NOT NULL REFERENCES public.battle_sets(set_date) ON DELETE CASCADE,
  opponent_run_id UUID REFERENCES public.battle_runs(id) ON DELETE SET NULL,
  questions_correct INT NOT NULL DEFAULT 0,
  questions_wrong INT NOT NULL DEFAULT 0,
  total_time_ms INT NOT NULL DEFAULT 0,
  event_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  result TEXT CHECK (result IN ('win','loss','tie')),
  daily_rank INT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX battle_runs_user_date_uidx ON public.battle_runs (user_id, battle_date);
CREATE INDEX battle_runs_leaderboard_idx ON public.battle_runs (battle_date, questions_correct DESC, total_time_ms ASC);
CREATE INDEX battle_runs_recent_idx ON public.battle_runs (battle_date, completed_at DESC);
GRANT SELECT, INSERT ON public.battle_runs TO authenticated;
GRANT ALL ON public.battle_runs TO service_role;
ALTER TABLE public.battle_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own battle_runs" ON public.battle_runs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR id IN (SELECT opponent_run_id FROM public.battle_runs WHERE user_id = auth.uid() AND opponent_run_id IS NOT NULL)
  );
CREATE POLICY "Users insert own battle_runs" ON public.battle_runs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.battle_leaderboard_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  battle_date DATE NOT NULL,
  rank INT NOT NULL,
  alerted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX battle_alerts_user_date_uidx ON public.battle_leaderboard_alerts (user_id, battle_date);
GRANT SELECT ON public.battle_leaderboard_alerts TO authenticated;
GRANT ALL ON public.battle_leaderboard_alerts TO service_role;
ALTER TABLE public.battle_leaderboard_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own battle alerts" ON public.battle_leaderboard_alerts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
