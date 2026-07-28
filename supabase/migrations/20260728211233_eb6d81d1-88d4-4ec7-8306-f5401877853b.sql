-- 1. battle_fake_profiles table
CREATE TABLE public.battle_fake_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  avatar_character text NOT NULL,
  avatar_color text NOT NULL,
  avatar_accessory text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.battle_fake_profiles TO authenticated;
GRANT ALL ON public.battle_fake_profiles TO service_role;

ALTER TABLE public.battle_fake_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read fake profiles"
ON public.battle_fake_profiles FOR SELECT TO authenticated USING (true);

-- 2. battle_runs additive columns
ALTER TABLE public.battle_runs
  ADD COLUMN is_fake boolean NOT NULL DEFAULT false,
  ADD COLUMN fake_profile_id uuid NULL REFERENCES public.battle_fake_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.battle_runs ALTER COLUMN user_id DROP NOT NULL;

DROP INDEX IF EXISTS public.battle_runs_user_date_uidx;
CREATE UNIQUE INDEX battle_runs_real_user_date_uidx
  ON public.battle_runs (user_id, battle_date) WHERE is_fake = false;
CREATE UNIQUE INDEX battle_runs_fake_profile_date_uidx
  ON public.battle_runs (fake_profile_id, battle_date) WHERE is_fake = true;

ALTER TABLE public.battle_runs
  ADD CONSTRAINT battle_runs_fake_shape_chk CHECK (
    (is_fake = true AND user_id IS NULL AND fake_profile_id IS NOT NULL)
    OR (is_fake = false AND user_id IS NOT NULL AND fake_profile_id IS NULL)
  );

-- 3. seed 100 fake profiles (one-time)
INSERT INTO public.battle_fake_profiles (name, avatar_character, avatar_color, avatar_accessory) VALUES
('Maya','pig','#FF8A3D','ice'),
('Jordan','panda','#A855F7','cap'),
('Aisha','bear','#9DAEFF','ice'),
('Liam','eagle','#FF6FB5','flower'),
('Sofia','bear','#A855F7','brain'),
('Ethan','frog','#FFE600','bulb'),
('Priya','pig','#FFE600','goggles'),
('Noah','pig','#FFE600','bulb'),
('Zara','eagle','#FF4D6D','goggles'),
('Lucas','eagle','#B8FF00','goggles'),
('Amara','pig','#FF4D6D','goggles'),
('Mason','eagle','#F6F0FA','fire'),
('Elena','eagle','#A855F7','poop'),
('Kai','bear','#9DAEFF','bolt'),
('Naomi','shiba','#7CF6B0','disco'),
('Diego','bear','#FFE600','grad'),
('Chloe','panda','#FF6FB5','bolt'),
('Omar','eagle','#7CF6B0','ice'),
('Ivy','panda','#FF4D6D','crown'),
('Ravi','shiba','#9DAEFF','fire'),
('Grace','pig','#9DAEFF','tophat'),
('Marcus','eagle','#FF6FB5','star'),
('Layla','frog','#FF4D6D','brain'),
('Owen','pig','#FF8A3D','poop'),
('Fatima','eagle','#FF8A3D','poop'),
('Tyler','pig','#FFE600','disco'),
('Mei','bear','#FF6FB5','tophat'),
('Caleb','bear','#FFE600','bolt'),
('Nadia','bear','#7CF6B0','none'),
('Hunter','pig','#FF4D6D','flower'),
('Isabella','frog','#7CF6B0','flower'),
('Andre','eagle','#FF8A3D','disco'),
('Willow','bear','#7CF6B0','cap'),
('Jamal','bear','#7CF6B0','fire'),
('Sienna','panda','#F6F0FA','tophat'),
('Felix','shiba','#FF8A3D','crown'),
('Anya','panda','#5BE1FF','cap'),
('Xavier','pig','#9DAEFF','star'),
('Ruby','shiba','#FF6FB5','goggles'),
('Kofi','bear','#9DAEFF','tophat'),
('Delilah','shiba','#FF6FB5','brain'),
('Gavin','pig','#FF4D6D','fire'),
('Mira','pig','#F6F0FA','fire'),
('Emmett','panda','#9DAEFF','ice'),
('Sasha','panda','#FFE600','tophat'),
('Idris','panda','#5BE1FF','fire'),
('Paloma','pig','#A855F7','crown'),
('Weston','frog','#FF4D6D','bolt'),
('Yara','bear','#B8FF00','grad'),
('Rocco','pig','#A855F7','none'),
('Talia','eagle','#FF6FB5','bulb'),
('Bodhi','eagle','#5BE1FF','goggles'),
('Nia','shiba','#FF4D6D','none'),
('Silas','eagle','#FFE600','cap'),
('Amina','bear','#FF4D6D','crown'),
('Roman','eagle','#FF6FB5','none'),
('Freya','pig','#F6F0FA','goggles'),
('Malik','eagle','#9DAEFF','bulb'),
('Colette','frog','#FF4D6D','star'),
('Enzo','bear','#A855F7','star'),
('Harlow','panda','#7CF6B0','brain'),
('Dax','bear','#F6F0FA','flower'),
('Selah','bear','#7CF6B0','poop'),
('Jasper','pig','#A855F7','fire'),
('Rosalind','shiba','#FF4D6D','poop'),
('Beckett','bear','#9DAEFF','none'),
('Zuri','pig','#FF8A3D','tophat'),
('Milo','panda','#FFE600','goggles'),
('Anouk','eagle','#FF4D6D','none'),
('Theo','pig','#5BE1FF','poop'),
('Winnie','shiba','#F6F0FA','tophat'),
('Callum','panda','#9DAEFF','disco'),
('Esme','pig','#F6F0FA','brain'),
('Reza','shiba','#FF8A3D','tophat'),
('Poppy','eagle','#F6F0FA','cap'),
('Ansel','frog','#B8FF00','flower'),
('Marisol','shiba','#FF6FB5','fire'),
('Duke','bear','#B8FF00','disco'),
('Vivienne','frog','#B8FF00','star'),
('Corbin','pig','#A855F7','star'),
('Alaia','pig','#7CF6B0','ice'),
('Sonny','panda','#7CF6B0','none'),
('Estella','panda','#F6F0FA','disco'),
('Griffin','eagle','#FF6FB5','fire'),
('Rania','panda','#FF6FB5','flower'),
('NoSleep','bear','#F6F0FA','grad'),
('Clueless','pig','#B8FF00','goggles'),
('RiskyQuiznus','panda','#FF4D6D','cap'),
('Studybuddy','frog','#FF8A3D','crown'),
('Curvewrecker','eagle','#9DAEFF','brain'),
('StanfordBound','pig','#A855F7','disco'),
('Whatismath','bear','#FF8A3D','flower'),
('ExammaSlamma','frog','#FFE600','fire'),
('QuizardofOz','panda','#FF8A3D','ice'),
('NoSleep','panda','#FF8A3D','disco'),
('GucciBrain','frog','#9DAEFF','brain'),
('Quadratic','frog','#FFE600','star'),
('SATKiller','panda','#A855F7','crown'),
('GoUCLA','bear','#F6F0FA','none'),
('Sixteenhundred','frog','#FFE600','flower');