import { useEffect, useState } from "react";

const BAND_COLOR = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
};

export default function RiskGauge({ score, band }) {
  // Animate the displayed percentage and the arc sweep together, so the
  // number ticking up and the ring filling in feel like one motion rather
  // than two separately-triggered effects.
  const [displayPct, setDisplayPct] = useState(0);
  const targetPct = Math.round(score * 100);

  useEffect(() => {
    let raf;
    const duration = 700;
    const start = performance.now();
    const from = displayPct;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(from + (targetPct - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct]);

  const radius = 78;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayPct / 100);
  const color = BAND_COLOR[band] || "var(--accent)";

  return (
    <div className="risk-gauge">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke 0.4s ease" }}
        />
        <text
          x="100"
          y="94"
          textAnchor="middle"
          className="gauge-number"
          fill="var(--ink)"
        >
          {displayPct}%
        </text>
        <text
          x="100"
          y="120"
          textAnchor="middle"
          className="gauge-label"
          fill="var(--ink-muted)"
        >
          risk score
        </text>
      </svg>
    </div>
  );
}
