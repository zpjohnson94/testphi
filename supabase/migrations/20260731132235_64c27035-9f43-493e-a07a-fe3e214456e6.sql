GRANT SELECT, INSERT ON TABLE public.battle_runs TO authenticated;
GRANT ALL ON TABLE public.battle_runs TO service_role;

DROP POLICY IF EXISTS "Users read own battle_runs" ON public.battle_runs;

CREATE OR REPLACE FUNCTION public.can_read_battle_run(_run_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.battle_runs AS own_run
    WHERE own_run.user_id = _user_id
      AND own_run.opponent_run_id = _run_id
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_read_battle_run(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_battle_run(uuid, uuid) TO service_role;

CREATE POLICY "Users read permitted battle runs"
ON public.battle_runs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_read_battle_run(id, auth.uid())
);