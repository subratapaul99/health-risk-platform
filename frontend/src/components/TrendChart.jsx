import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function TrendChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="empty-state">
        Submit at least two assessments to see a risk trend over time.
      </div>
    );
  }

  const data = history.map((h, i) => ({
    label: `#${i + 1}`,
    risk: Math.round(h.risk_score * 100),
    date: new Date(h.created_at).toLocaleDateString(),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#d9dcd6" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5b6b66" }} axisLine={{ stroke: "#d9dcd6" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#5b6b66" }} axisLine={false} tickLine={false} width={36} />
        <ReferenceLine y={50} stroke="#c9b98a" strokeDasharray="4 4" />
        <Tooltip
          formatter={(value) => [`${value}%`, "Risk score"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
          contentStyle={{ fontSize: 13, borderRadius: 6, border: "1px solid #d9dcd6" }}
        />
        <Line type="monotone" dataKey="risk" stroke="#2f6e62" strokeWidth={2} dot={{ r: 3, fill: "#2f6e62" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
