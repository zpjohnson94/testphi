CREATE POLICY "Users can delete their own daily attempts" ON public.daily_attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own answers" ON public.answers FOR DELETE TO authenticated USING (auth.uid() = user_id);