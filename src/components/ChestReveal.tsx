// Full-screen chest reveal experience: tap 12 times, unlock, celebrate.
import { useEffect, useMemo, useRef, useState } from "react";
import chestImg from "@/assets/chest-buried.png";
import { sfx } from "@/lib/sfx";


interface Props {
  domainName: string;
  masteryPct: number;
  onDone: () => void;
}

const TAPS_TO_UNLOCK = 12;

interface Sand {
  id: number;
  dx: number;
  dy: number;
  size: number;
  hue: number;
  born: number;
}

export function ChestReveal({ domainName, masteryPct, onDone }: Props) {
  const [taps, setTaps] = useState(0);
  const [opened, setOpened] = useState(false);
  const [flash, setFlash] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [sand, setSand] = useState<Sand[]>([]);
  const seq = useRef(0);
  const chestRef = useRef<HTMLDivElement | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const shakeAmp = useMemo(() => 2 + (taps / TAPS_TO_UNLOCK) * 10, [taps]);

  const doTap = () => {
    if (opened) return;
    sfx.tap();
    const next = taps + 1;
    setTaps(next);
    setShakeKey((k) => k + 1);

    // emit sand particles
    const count = 6 + Math.floor(Math.random() * 5);
    const newSand: Sand[] = Array.from({ length: count }).map(() => {
      const angle = Math.PI + Math.random() * Math.PI; // downward-ish spray
      const speed = 40 + Math.random() * 60;
      return {
        id: ++seq.current,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed + 30, // gravity bias
        size: 4 + Math.random() * 5,
        hue: 42 + Math.random() * 12,
        born: Date.now(),
      };
    });
    setSand((s) => [...s, ...newSand]);
    window.setTimeout(() => {
      setSand((s) => s.filter((p) => !newSand.find((n) => n.id === p.id)));
    }, 750);

    if (next >= TAPS_TO_UNLOCK) {
      setOpened(true);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 500);
      window.setTimeout(() => setReveal(true), 350);
    }
  };

  useEffect(() => {
    // block body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 85%, rgba(184,255,0,0.28), transparent 55%), linear-gradient(180deg, #0f0820 0%, #1a0f38 60%, #2a0e54 100%)",
      }}
    >
      {/* Chest interactive stage */}
      {!reveal && (
        <div
          className="relative flex flex-col items-center gap-6 select-none"
          onClick={doTap}
          role="button"
          aria-label="Tap the chest to unlock"
        >
          <div
            className="relative"
            style={{ width: 280, height: 280, animation: "chest-pulse 2.4s ease-in-out infinite" }}
          >
            <div
              ref={chestRef}
              key={shakeKey}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: opened
                  ? "chest-pulse 400ms ease-out"
                  : `chest-shake 120ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both`,
                ["--shake" as any]: `${shakeAmp}deg`,
                transformOrigin: "50% 80%",
              }}
            >
              <img
                src={chestImg}
                alt=""
                width={280}
                height={280}
                loading="lazy"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: opened
                    ? "drop-shadow(0 0 30px rgba(184,255,0,0.85)) brightness(1.15)"
                    : "drop-shadow(0 8px 20px rgba(0,0,0,0.55))",
                  transition: "filter 200ms ease",
                }}
              />
            </div>
            {/* Sand particles anchored to chest base */}
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
              {sand.map((p) => (
                <span
                  key={p.id}
                  style={{
                    position: "absolute",
                    width: p.size,
                    height: p.size,
                    borderRadius: "50%",
                    background: `hsl(${p.hue}, 78%, 62%)`,
                    boxShadow: "0 0 2px rgba(0,0,0,0.25)",
                    animation: "sand-fly 700ms cubic-bezier(0.2, 0.6, 0.4, 1) forwards",
                    ["--dx" as any]: `${p.dx}px`,
                    ["--dy" as any]: `${p.dy}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <div
              className="display text-2xl uppercase tracking-[0.18em]"
              style={{ color: "var(--volt)", textShadow: "0 0 22px rgba(184,255,0,0.7)" }}
            >
              Tap to unlock!
            </div>
          </div>

        </div>
      )}

      {/* Flash */}
      {flash && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: "var(--volt)", animation: "screen-flash 500ms ease-out both" }}
        />
      )}

      {/* Mastery reveal */}
      {reveal && (
        <div
          className="relative w-full max-w-md mx-4 rounded-3xl p-8 text-center animate-fade-up"
          style={{
            background: "linear-gradient(140deg, #2a0e54 0%, #1a0b2e 100%)",
            border: "2px solid var(--volt)",
            boxShadow: "0 0 80px -10px rgba(184,255,0,0.7)",
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at top, rgba(184,255,0,0.35), transparent 60%)",
              animation: "chest-pulse 2.4s ease-in-out infinite",
            }}
          />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
              Your mastery score is calibrated.
            </div>
            <h2 className="mt-3 display text-2xl text-[var(--lavender)]">{domainName}</h2>
            <div className="mt-6">
              <div
                className="score-num text-[72px] leading-none"
                style={{ color: "var(--volt)", textShadow: "0 0 24px rgba(184,255,0,0.5)" }}
              >
                <AnimatedPct target={Math.round(masteryPct)} />%
              </div>
              <div className="mt-4 h-4 rounded-full overflow-hidden" style={{ background: "rgba(246,240,250,0.1)", border: "1px solid rgba(184,255,0,0.25)" }}>
                <div
                  className="mastery-swirl-fill h-full rounded-full transition-all duration-[1400ms] ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, Math.round(masteryPct)))}%` }}
                />
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(246,240,250,0.6)" }}>
                Mastery
              </div>
            </div>

            <button onClick={onDone} className="btn-volt w-full mt-8 py-4 rounded-2xl text-base">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
