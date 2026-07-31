DROP POLICY IF EXISTS "Users read permitted battle runs" ON public.battle_runs;

CREATE POLICY "Users read own battle runs"
ON public.battle_runs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.can_read_battle_run(uuid, uuid) FROM service_role;
DROP FUNCTION public.can_read_battle_run(uuid, uuid);