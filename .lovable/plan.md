
# SAT Quest — Adaptive SAT Prep

A fun, game-like SAT prep app for high schoolers. Inspired by Duolingo's lesson maps and Chess.com's rating system. Adapts content to each user's weaknesses.

## Core Experience

**Onboarding (3 min)**
- Sign up with email (Lovable Cloud auth).
- Quick 6-question diagnostic (3 R&W, 3 Math) to seed starting ELO and identify initial skill gaps.
- Choose an avatar/character and a daily XP goal (10 / 20 / 50 XP).

**Home Dashboard**
- Big ELO card at top showing **Overall Rating** with a projected SAT score band (e.g. "1340 ± 40") and a tier badge (Bronze → Silver → Gold → Platinum → Diamond, like chess.com).
- Two smaller sub-rating cards below: **Reading & Writing ELO → projected 200–800** and **Math ELO → projected 200–800**.
- Daily streak flame, daily XP goal progress ring, and a "Continue lesson" CTA that jumps back to the last node.
- Recent achievements row + a "Today's weakness focus" chip (e.g. "Linear equations need work").

**Section Maps (the platformer)**
- Two tabs/buttons from the dashboard: **Reading & Writing** and **Math**, each opening its own scrolling map.
- Vertical winding path, Duolingo-style, divided into themed **worlds**:
  - R&W worlds: *Grammar Grove*, *Vocab Valley*, *Evidence Isle*, *Rhetoric Ridge*, *Inference Inlet*.
  - Math worlds: *Algebra Atoll*, *Geometry Gorge*, *Stats Swamp*, *Advanced Math Mountain*, *Problem-Solving Peaks*.
- Each world has 5–8 **nodes** along the path. Node states: locked, available (pulsing), in-progress, completed (gold), perfected (3/3 correct, sparkle).
- A character sprite sits on the user's current node; tapping the next available node opens the lesson.
- Boss/checkpoint node every 5 lessons = a 10-question mixed quiz that updates ELO more heavily.

**Lesson Node Flow**
1. **Mini-lesson** (60–90 sec): 1–2 screens, plain explanation + a worked example. Tap-through, no wall of text.
2. **3 practice questions**: real SAT-style multiple choice, one at a time.
   - Immediate feedback per question with a short explanation.
   - Wrong answer shakes + plays a soft buzz; correct answer pops + chime.
3. **Results screen**: XP earned, ELO change (+12 / −8 etc.), accuracy, "Skill mastery" bar for the underlying micro-skill, Continue button.

**Adaptive Engine**
- Every node is tagged with 1–2 micro-skills (e.g. "subject-verb agreement", "linear systems").
- Each user has a per-micro-skill mastery score (0–100) updated after every question.
- The map adapts: if mastery on a skill drops, the next available nodes prioritize that skill, and bonus "review" nodes appear in-line on the path with a distinct color.
- Hybrid content sourcing: a curated seed bank of lessons + questions per micro-skill ships with the app; the AI Gateway generates **extra adaptive practice** targeted at the user's weakest skills (used for review nodes and the "Daily Weakness Drill" on the dashboard).

**ELO System**
- Each section (R&W, Math) has its own Glicko-style rating starting from the diagnostic.
- Each question has an implicit difficulty rating; correct/incorrect updates the user's section ELO.
- Section ELO maps linearly to a 200–800 projected score band; sum gives 400–1600 overall.
- Overall ELO is a weighted blend of the two section ELOs (kept as its own number so the dashboard tier feels stable).

## Visual & Sound Direction

- Bright, friendly, slightly cartoony. Rounded shapes, soft shadows, generous whitespace.
- Per-world color theming (e.g. Algebra Atoll = teal/sand, Grammar Grove = green).
- Smooth animations: nodes scale on hover, character "hops" between nodes on completion, XP counter rolls up, confetti on perfect lessons, screen shake on wrong streaks.
- Light + dark mode.
- Subtle SFX for correct/incorrect/level-up (toggleable in settings).

## Pages / Routes

- `/` — Marketing landing (hero, how it works, CTA to sign up).
- `/login`, `/signup`, `/reset-password`
- `/onboarding` — diagnostic + goal setup
- `/dashboard` — home (ELO, streak, continue, weakness focus)
- `/learn/reading-writing` — R&W world map
- `/learn/math` — Math world map
- `/lesson/$nodeId` — lesson + 3-question practice + results
- `/quiz/$checkpointId` — boss checkpoint quiz
- `/profile` — stats, ELO history graph, achievements, skill mastery breakdown
- `/settings` — sounds, daily goal, account

## Data Model (high level)

- `profiles` — user info, avatar, daily goal, streak, current overall/section ELOs
- `skills` — catalog of micro-skills, parent world, section
- `lessons` — seed lesson content keyed by skill
- `questions` — seed question bank, each tagged with skills + difficulty
- `user_skill_mastery` — per-user mastery score per skill
- `user_progress` — completion + score per node
- `attempts` — every question answered, for ELO + analytics
- `elo_history` — daily snapshots for the profile graph

Roles in a separate `user_roles` table (admin role for future content authoring).

## Scope for v1 (what gets built first)

1. Auth + onboarding diagnostic
2. Dashboard with ELO cards, streak, continue CTA
3. Both section maps with one full themed world each (5 nodes + 1 checkpoint)
4. Lesson player (mini-lesson + 3 questions + results) with seed content
5. ELO + per-skill mastery updates
6. Profile page with ELO history and mastery breakdown

Adaptive AI-generated review nodes and additional worlds come in a follow-up pass once the loop feels good.

## Technical Notes

- Lovable Cloud for auth (email + Google), database, and storage.
- Lovable AI Gateway for adaptive question/lesson generation, called via server functions.
- TanStack Start with a route per page above; server functions for all DB writes (attempts, ELO updates) so RLS and rating logic stay server-side.
- Seed content stored in DB tables, loaded once on first deploy via a server function.
