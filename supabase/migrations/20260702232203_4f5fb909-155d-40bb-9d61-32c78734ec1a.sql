
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER SCORING STATE ============
CREATE TABLE public.user_scoring_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_score INTEGER NOT NULL DEFAULT 800,
  seeded BOOLEAN NOT NULL DEFAULT false,
  momentum_needle INTEGER NOT NULL DEFAULT 0,
  last_momentum_date DATE,
  qualifying_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  streak INTEGER NOT NULL DEFAULT 0,
  last_daily_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_scoring_state TO authenticated;
GRANT ALL ON public.user_scoring_state TO service_role;
ALTER TABLE public.user_scoring_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own scoring state" ON public.user_scoring_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own scoring state" ON public.user_scoring_state FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own scoring state" ON public.user_scoring_state FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ USER DOMAIN MASTERY ============
CREATE TABLE public.user_domain_mastery (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL,
  answered INTEGER NOT NULL DEFAULT 0,
  initialized BOOLEAN NOT NULL DEFAULT false,
  mastery NUMERIC NOT NULL DEFAULT 0,
  last_answered_at DATE,
  bonus_step SMALLINT NOT NULL DEFAULT 0,
  batch JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, domain_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_domain_mastery TO authenticated;
GRANT ALL ON public.user_domain_mastery TO service_role;
ALTER TABLE public.user_domain_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own mastery" ON public.user_domain_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own mastery" ON public.user_domain_mastery FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own mastery" ON public.user_domain_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ SESSIONS ============
CREATE TABLE public.sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  prev_overall INTEGER,
  new_overall INTEGER,
  delta INTEGER,
  momentum_before INTEGER,
  momentum_after INTEGER,
  streak_before INTEGER,
  streak_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_completed_at_idx ON public.sessions (user_id, completed_at DESC);
GRANT SELECT, INSERT ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ ANSWERS ============
CREATE TABLE public.answers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  difficulty SMALLINT NOT NULL,
  correct BOOLEAN NOT NULL,
  elapsed_seconds NUMERIC NOT NULL,
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX answers_user_id_answered_at_idx ON public.answers (user_id, answered_at DESC);
CREATE INDEX answers_session_id_idx ON public.answers (session_id);
GRANT SELECT, INSERT ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own answers" ON public.answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ QUESTIONS (reference bank) ============
CREATE TABLE public.questions (
  id TEXT NOT NULL PRIMARY KEY,
  domain_id TEXT NOT NULL,
  difficulty SMALLINT NOT NULL,
  expected_seconds INTEGER NOT NULL DEFAULT 60,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER user_scoring_state_updated_at BEFORE UPDATE ON public.user_scoring_state FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER user_domain_mastery_updated_at BEFORE UPDATE ON public.user_domain_mastery FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Auto-provision on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  domain_ids TEXT[] := ARRAY[
    'math-algebra','math-advanced','math-data','math-geo',
    'rw-info','rw-craft','rw-expr','rw-conv'
  ];
  d TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_scoring_state (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  FOREACH d IN ARRAY domain_ids LOOP
    INSERT INTO public.user_domain_mastery (user_id, domain_id)
    VALUES (NEW.id, d)
    ON CONFLICT (user_id, domain_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
