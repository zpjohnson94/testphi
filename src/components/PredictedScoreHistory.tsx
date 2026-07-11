import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import {
  DOMAINS,
  SCORING,
  isCalibrated,
  todayISO,
  type FreeState,
} from "@/lib/freeUser";

type Pt = {
  date: string;      // ISO YYYY-MM-DD
  ts: number;        // epoch for X axis
  score: number;
  projected: boolean;
  pre: number | null;   // pre-calibration line value
  post: number | null;  // post-calibration line value
};

function isoAddDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  const t1 = new Date(a + "T00:00:00").getTime();
  const t2 = new Date(b + "T00:00:00").getTime();
  return Math.max(0, Math.round((t2 - t1) / 86400000));
}
function fmtShort(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Approximate calibration date from stored state. We don't persist the exact
// day all 8 domains initialized, so we pick the qualifying day at which the
// user has plausibly answered enough questions across domains (5 per domain).
function approxCalibrationDate(state: FreeState, sessionDays: string[]): string | null {
  if (!isCalibrated(state)) return null;
  if (sessionDays.length === 0) return null;
  // Rough: ~1/3 of the way through their qualifying days, minimum first one.
  const idx = Math.min(sessionDays.length - 1, Math.max(0, Math.floor(sessionDays.length / 3)));
  return sessionDays[idx];
}

// Score-level decay proxy of the per-domain formula, applied on read only.
function decayScore(prev: number, idleDays: number, baselineFloor: number): number {
  if (idleDays <= SCORING.DECAY_GRACE_DAYS) return prev;
  const weeks = (idleDays - SCORING.DECAY_GRACE_DAYS) / 7;
  const dropped = prev * (1 - (SCORING.DECAY_PER_WEEK / 100) * weeks);
  return Math.max(baselineFloor, Math.round(dropped));
}

function niceCeil(n: number, step: number) {
  return Math.ceil(n / step) * step;
}
function niceFloor(n: number, step: number) {
  return Math.floor(n / step) * step;
}

export function PredictedScoreHistory({ state }: { state: FreeState }) {
  const points = useMemo<Pt[]>(() => {
    // Find diagnostic date: earliest lastAnsweredISO across domain stats.
    const stamps = DOMAINS
      .map((d) => state.domainStats[d.id]?.lastAnsweredISO)
      .filter((s): s is string => !!s);
    const diagDate = stamps.length
      ? stamps.slice().sort()[0]
      : state.qualifyingDays[0] ?? todayISO();

    const today = todayISO();
    const sessionDays = Array.from(new Set(state.qualifyingDays)).sort();
    const sessionSet = new Set(sessionDays);

    const start = state.diagnosticScore || 800;
    const end = state.overall || start;

    // Assign per-session-day scores by linear interpolation between
    // diagnostic and current overall (persisted per-session snapshots
    // aren't available in this codebase). Diagnostic day anchors at start.
    const perSessionScore = new Map<string, number>();
    perSessionScore.set(diagDate, start);
    if (sessionDays.length > 0) {
      const n = sessionDays.length;
      sessionDays.forEach((d, i) => {
        const t = n === 1 ? 1 : (i + 1) / n;
        perSessionScore.set(d, Math.round(start + (end - start) * t));
      });
    }

    const calDate = approxCalibrationDate(state, sessionDays);
    const totalDays = daysBetween(diagDate, today);
    const baselineFloor = Math.max(400, Math.round(start * 0.7));

    const out: Pt[] = [];
    let prev = start;
    let lastSessionDay = diagDate;

    for (let i = 0; i <= totalDays; i++) {
      const date = isoAddDays(diagDate, i);
      let score: number;
      let projected: boolean;

      if (date === diagDate) {
        score = start;
        projected = false;
      } else if (sessionSet.has(date)) {
        score = perSessionScore.get(date) ?? prev;
        projected = false;
        lastSessionDay = date;
      } else if (date === today) {
        score = end;
        projected = false;
      } else {
        const idle = daysBetween(lastSessionDay, date);
        score = decayScore(prev, idle, baselineFloor);
        projected = true;
      }

      const solid = !!calDate && date >= calDate;
      out.push({
        date,
        ts: new Date(date + "T00:00:00").getTime(),
        score,
        projected,
        pre: solid ? null : score,
        post: solid ? score : null,
      });
      prev = score;
    }

    // Ensure continuity at the calibration transition point (shared vertex
    // appears on both lines so they visually meet).
    if (calDate) {
      const idx = out.findIndex((p) => p.date === calDate);
      if (idx >= 0) out[idx].pre = out[idx].score;
    }
    return out;
  }, [state]);

  const hasHistory = points.length > 1;

  // Adaptive Y range.
  const { yMin, yMax } = useMemo(() => {
    const vals = points.map((p) => p.score);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    if (lo === hi) {
      return { yMin: Math.max(400, lo - 40), yMax: Math.min(1600, hi + 40) };
    }
    const pad = Math.max(20, Math.round((hi - lo) * 0.1));
    return {
      yMin: Math.max(400, niceFloor(lo - pad, 20)),
      yMax: Math.min(1600, niceCeil(hi + pad, 20)),
    };
  }, [points]);

  return (
    <div className="mt-4">
      <div className="h-40 sm:h-48 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={fmtShort}
              tick={{ fill: "rgba(246,240,250,0.55)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(246,240,250,0.15)" }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "rgba(246,240,250,0.55)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(246,240,250,0.15)" }}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(20,12,40,0.97)",
                border: "1px solid rgba(168,85,247,0.5)",
                borderRadius: 8,
                fontSize: 12,
                color: "rgba(246,240,250,0.95)",
              }}
              labelFormatter={(v) => fmtShort(Number(v))}
              formatter={(val: number, _n, item: any) => {
                const p: Pt = item?.payload;
                return [`${val}${p?.projected ? " (projected)" : ""}`, "Score"];
              }}
            />
            {/* Pre-calibration: dashed muted */}
            <Line
              type="monotone"
              dataKey="pre"
              stroke="rgba(246,240,250,0.45)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {/* Post-calibration: solid, neon */}
            <Line
              type="monotone"
              dataKey="post"
              stroke="var(--volt)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {!hasHistory && (
              <ReferenceDot
                x={points[0]?.ts}
                y={points[0]?.score}
                r={5}
                fill="var(--volt)"
                stroke="none"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasHistory && (
        <div
          className="mt-2 text-xs text-center"
          style={{ color: "rgba(246,240,250,0.65)" }}
        >
          Keep practicing to see your score grow over time.
        </div>
      )}
    </div>
  );
}
