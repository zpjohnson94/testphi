import { useEffect, useState } from "react";

interface MomentumGaugeProps {
  needle: number;        // 0..10
  size?: number;
  animate?: boolean;
  delayMs?: number;
}

// Returns colors/glow for a given needle stage (per spec table)
function visualStage(n: number) {
  if (n <= 2) {
    return { face: "#1b1d28", arc: "#3b4a66", needle: "#7d8aa6", glow: "transparent", pulse: false, vibrate: false };
  }
  if (n <= 5) {
    return { face: "#241e16", arc: "#a76a1a", needle: "#ffb74d", glow: "rgba(255,167,38,0.35)", pulse: false, vibrate: false };
  }
  if (n <= 9) {
    return { face: "#2a210b", arc: "#e0a020", needle: "#ffd54f", glow: "rgba(255,213,79,0.55)", pulse: true, vibrate: false };
  }
  return { face: "#1c2a2e", arc: "#80f0ff", needle: "#e8fbff", glow: "rgba(184,255,255,0.7)", pulse: true, vibrate: true };
}

export function MomentumGauge({ needle, size = 180, animate = true, delayMs = 0 }: MomentumGaugeProps) {
  const [shown, setShown] = useState(animate ? 0 : needle);
  useEffect(() => {
    if (!animate) {
      setShown(needle);
      return;
    }
    const t = setTimeout(() => {
      const start = shown;
      const end = needle;
      const dur = 900;
      const t0 = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(start + (end - start) * eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, animate, delayMs]);

  const stage = visualStage(shown);
  const w = size;
  const h = Math.round(size * 0.62);
  const cx = w / 2;
  const cy = h - 8;
  const r = w / 2 - 12;

  // Needle angle: −90° at 0, +90° at 10 (top semicircle)
  const angle = -90 + (shown / 10) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + Math.sin(rad) * needleLen;
  const ny = cy - Math.cos(rad) * needleLen;

  // Tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = -90 + (i / 10) * 180;
    const ra = (a * Math.PI) / 180;
    const inner = r - (i % 5 === 0 ? 12 : 7);
    const x1 = cx + Math.sin(ra) * inner;
    const y1 = cy - Math.cos(ra) * inner;
    const x2 = cx + Math.sin(ra) * r;
    const y2 = cy - Math.cos(ra) * r;
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={i / 10 <= shown / 10 ? stage.arc : "rgba(246,240,250,0.18)"}
        strokeWidth={i % 5 === 0 ? 2 : 1}
      />,
    );
  }

  const multiplier = 1 + shown * 0.05;
  const intensity = Math.min(1, shown / 10); // 0..1
  const electric = shown >= 10;
  const superElectric = shown >= 10;

  return (
    <div className="inline-flex flex-col items-center" style={{ width: w }}>
      <svg
        width={w}
        height={h + 6}
        viewBox={`0 0 ${w} ${h + 6}`}
        style={{
          filter: stage.glow !== "transparent" ? `drop-shadow(0 0 ${10 + intensity * 18}px ${stage.glow})` : undefined,
          animation: stage.pulse ? "momentumPulse 2.4s ease-in-out infinite" : undefined,
        }}
      >
        <defs>
          <linearGradient id="mg-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stage.arc} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stage.needle} stopOpacity={0.95} />
          </linearGradient>
          <radialGradient id="mg-shine" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stopColor={stage.needle} stopOpacity={0.55} />
            <stop offset="60%" stopColor={stage.arc} stopOpacity={0.15} />
            <stop offset="100%" stopColor={stage.arc} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Gauge face */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx + r - 2} ${cy} A ${r - 2} ${r - 2} 0 0 0 ${cx - r + 2} ${cy} Z`}
          fill={stage.face}
          stroke="rgba(0,0,0,0.4)"
        />
        {/* Filled wedge — from left edge up to needle angle */}
        <path
          d={describeRingArc(cx, cy, r - 3, 6, -90, -90 + (shown / 10) * 180)}
          fill="url(#mg-fill)"
          style={{
            animation: superElectric ? "electricFlicker 0.28s steps(2) infinite" : undefined,
          }}
        />
        {electric && (
          <path
            d={describeRingArc(cx, cy, r - 3, 6, -90, -90 + (shown / 10) * 180)}
            fill="url(#mg-shine)"
            style={{ mixBlendMode: "screen", animation: "electricSweep 1.6s linear infinite" }}
          />
        )}
        {/* Outer active arc (bright rim) */}
        <path
          d={describeRingArc(cx, cy, r, r - 2, -90, -90 + (shown / 10) * 180)}
          fill={stage.arc}
        />
        {ticks}
        {/* Lightning bolts at max intensity */}
        {superElectric && (
          <g style={{ animation: "boltFlash 0.4s steps(2) infinite" }}>
            {[0, 1, 2].map((i) => {
              const a = -80 + (i * 80);
              const ra = (a * Math.PI) / 180;
              const x1 = cx + Math.sin(ra) * (r - 20);
              const y1 = cy - Math.cos(ra) * (r - 20);
              const x2 = cx + Math.sin(ra) * (r - 4);
              const y2 = cy - Math.cos(ra) * (r - 4);
              const mx = (x1 + x2) / 2 + (i % 2 === 0 ? 4 : -4);
              const my = (y1 + y2) / 2;
              return (
                <polyline
                  key={i}
                  points={`${x1},${y1} ${mx},${my} ${x2},${y2}`}
                  fill="none"
                  stroke={stage.needle}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${stage.needle})` }}
                />
              );
            })}
          </g>
        )}

        {/* Needle */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: stage.vibrate ? "needleVibrate 0.15s linear infinite" : undefined,
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={stage.needle}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={5} fill={stage.needle} />
          <circle cx={cx} cy={cy} r={2.5} fill="#0b0b0b" />
        </g>
      </svg>
      <div className="-mt-1 flex items-center gap-1">
        <span
          className="score-num text-2xl tabular-nums"
          style={{
            color: stage.needle,
            display: "inline-block",
            transform: `scale(${1 + intensity * 0.12})`,
            transformOrigin: "center",
            filter: `drop-shadow(0 0 ${6 + intensity * 14}px ${stage.glow})`,
            animation: superElectric
              ? "scoreFlicker 0.28s steps(2) infinite"
              : stage.pulse
                ? "scorePulse 2.4s ease-in-out infinite"
                : undefined,
          }}
        >
          {multiplier.toFixed(2)}
        </span>
        <span className="text-xs font-bold" style={{ color: "rgba(246,240,250,0.6)" }}>
          x multiplier
        </span>
      </div>
      <style>{`
        @keyframes momentumPulse {
          0%, 100% { filter: drop-shadow(0 0 10px ${stage.glow}); }
          50% { filter: drop-shadow(0 0 22px ${stage.glow}); }
        }
        @keyframes needleVibrate {
          0% { transform: rotate(-0.6deg); }
          50% { transform: rotate(0.6deg); }
          100% { transform: rotate(-0.6deg); }
        }
        @keyframes electricFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes electricSweep {
          0% { opacity: 0.2; transform: translateX(-2px); }
          50% { opacity: 0.9; transform: translateX(2px); }
          100% { opacity: 0.2; transform: translateX(-2px); }
        }
        @keyframes boltFlash {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes scorePulse {
          0%, 100% { transform: scale(${1 + intensity * 0.12}); filter: drop-shadow(0 0 ${6 + intensity * 14}px ${stage.glow}); }
          50% { transform: scale(${1 + intensity * 0.18}); filter: drop-shadow(0 0 ${6 + intensity * 22}px ${stage.glow}); }
        }
        @keyframes scoreFlicker {
          0%, 100% { opacity: 1; transform: scale(${1 + intensity * 0.12}); }
          50% { opacity: 0.85; transform: scale(${1 + intensity * 0.2}); }
        }
      `}</style>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // Needle-space angles: -90 = left, 0 = top, 90 = right.
  // Draw the active arc left-to-right along the top semicircle.
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function describeRingArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}
