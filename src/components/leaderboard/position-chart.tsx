"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChartData {
  race: string;
  [playerName: string]: number | string;
}

interface PlayerColor {
  name: string;
  color: string;
  image?: string | null;
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

function CustomDot({
  cx,
  cy,
  index,
  dataLength,
  player,
  colorIndex,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  player: PlayerColor;
  colorIndex: number;
}) {
  if (cx == null || cy == null || index == null) return null;
  const color = player.color || COLORS[colorIndex % COLORS.length];

  // Last point: show avatar
  if (index === dataLength - 1) {
    const r = 16;
    const clipId = `avatar-clip-${player.name.replace(/\s+/g, "-")}`;
    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r + 2} fill={color} />
        {player.image ? (
          <image
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            href={player.image}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <>
            <circle cx={cx} cy={cy} r={r} fill={color} />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={11}
              fontWeight="bold"
            >
              {player.name.slice(0, 2).toUpperCase()}
            </text>
          </>
        )}
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill={color} />;
}

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
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ right: 25 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="race" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
          <Tooltip />
          {players.map((p, i) => (
            <Line
              key={p.name}
              type="monotone"
              dataKey={p.name}
              stroke={p.color || COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => (
                <CustomDot
                  key={`dot-${p.name}-${props.index}`}
                  cx={props.cx as number}
                  cy={props.cy as number}
                  index={props.index as number}
                  dataLength={data.length}
                  player={p}
                  colorIndex={i}
                />
              )}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {players.map((p, i) => (
          <div key={p.name} className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={p.image || undefined} />
              <AvatarFallback
                className="text-base font-bold"
                style={{ backgroundColor: p.color || COLORS[i % COLORS.length], color: "white" }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-sm font-medium"
              style={{ color: p.color || COLORS[i % COLORS.length] }}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
