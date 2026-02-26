"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  race: string;
  [playerName: string]: number | string;
}

interface PlayerColor {
  name: string;
  color: string;
}

const COLORS = [
  "#e11d48",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function PositionChart({
  data,
  players,
}: {
  data: ChartData[];
  players: PlayerColor[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="race" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {players.map((p, i) => (
          <Line
            key={p.name}
            type="monotone"
            dataKey={p.name}
            stroke={p.color || COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
