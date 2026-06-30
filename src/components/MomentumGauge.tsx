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
  if (n <= 8) {
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

  return (
    <div className="inline-flex flex-col items-center" style={{ width: w }}>
      <svg
        width={w}
        height={h + 6}
        viewBox={`0 0 ${w} ${h + 6}`}
        style={{
          filter: stage.glow !== "transparent" ? `drop-shadow(0 0 14px ${stage.glow})` : undefined,
          animation: stage.pulse ? "momentumPulse 2.4s ease-in-out infinite" : undefined,
        }}
      >
        {/* Gauge face */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx + r - 2} ${cy} A ${r - 2} ${r - 2} 0 0 0 ${cx - r + 2} ${cy} Z`}
          fill={stage.face}
          stroke="rgba(0,0,0,0.4)"
        />
        {/* Active arc */}
        <path
          d={describeArc(cx, cy, r - 4, -90, -90 + (shown / 10) * 180)}
          stroke={stage.arc}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        {ticks}
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
      <div className="-mt-1 flex items-baseline gap-1">
        <span
          className="score-num text-2xl tabular-nums"
          style={{ color: stage.needle }}
        >
          {multiplier.toFixed(2)}
        </span>
        <span className="text-xs font-bold" style={{ color: "rgba(246,240,250,0.6)" }}>
          x momentum
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
      `}</style>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // Treat angles relative to top (12 o'clock) the same way as in the needle math.
  const start = polarToCartesian(cx, cy, r, endAngle + 90);
  const end = polarToCartesian(cx, cy, r, startAngle + 90);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
