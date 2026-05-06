
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  name text,
  plan text,
  billing text,
  notify_opt_in boolean,
  diagnostic_score jsonb,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated. Only service role (server) can read/write.

CREATE OR REPLACE FUNCTION public.tg_signups_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER signups_set_updated_at
BEFORE UPDATE ON public.signups
FOR EACH ROW EXECUTE FUNCTION public.tg_signups_set_updated_at();
