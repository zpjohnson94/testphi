import { useEffect, useState } from "react";
import { Info } from "lucide-react";

interface PredictedScoreProps {
  score: number;
  calibrated: boolean;
  animateFrom?: number;
  sizeClass?: string; // tailwind size class for the digits
}

export function PredictedScore({
  score,
  calibrated,
  animateFrom = 800,
  sizeClass = "text-[56px] sm:text-[96px]",
}: PredictedScoreProps) {
  const [shown, setShown] = useState(animateFrom);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const start = shown;
    const end = score;
    const dur = 1500;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (end - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const color = calibrated ? "var(--volt)" : "rgba(184,255,0,0.55)";
  const subColor = calibrated ? "rgba(184,255,0,0.6)" : "rgba(184,255,0,0.3)";

  return (
    <div className="relative">
      <div className="flex items-end gap-1.5">
        <div
          className={`score-num ${sizeClass} leading-none`}
          style={{ color, textShadow: calibrated ? "0 0 24px rgba(184,255,0,0.35)" : undefined }}
        >
          {shown}
        </div>
        <div className="score-num text-lg sm:text-2xl mb-1.5 sm:mb-2" style={{ color: subColor }}>
          /1600
        </div>
      </div>
      {!calibrated && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "rgba(246,240,250,0.08)",
            color: "rgba(246,240,250,0.75)",
            border: "1px solid rgba(246,240,250,0.18)",
          }}
        >
          <Info className="size-3" />
          Still calibrating
        </button>
      )}
      {open && !calibrated && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 text-sm leading-relaxed"
            style={{
              background: "rgba(20,12,40,0.98)",
              border: "1px solid rgba(168,85,247,0.5)",
              color: "rgba(246,240,250,0.92)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--volt)" }}>
              Still calibrating
            </div>
            This score is based only on your diagnostic. Unlock your mastery score in all 8 domains and we'll have enough data to give you a higher-confidence prediction.
          </div>
        </div>
      )}
    </div>
  );
}
