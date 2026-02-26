"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface StandingEntry {
  userId: string;
  nickname: string;
  totalPoints: number;
  racesPlayed: number;
}

export function StandingsTable({ standings }: { standings: StandingEntry[] }) {
  const t = useTranslations("leaderboard");

  const sorted = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

  const medals = ["text-yellow-500", "text-gray-400", "text-amber-700"];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t("rank")}</TableHead>
          <TableHead>{t("player")}</TableHead>
          <TableHead className="text-center">{t("racesPlayed")}</TableHead>
          <TableHead className="text-center">{t("avgPoints")}</TableHead>
          <TableHead className="text-right">{t("totalPoints")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((entry, i) => (
          <TableRow key={entry.userId}>
            <TableCell className="font-bold">
              <span className={i < 3 ? `${medals[i]} text-lg` : ""}>
                {i + 1}
              </span>
            </TableCell>
            <TableCell className="font-medium">{entry.nickname}</TableCell>
            <TableCell className="text-center">{entry.racesPlayed}</TableCell>
            <TableCell className="text-center">
              {entry.racesPlayed > 0
                ? (entry.totalPoints / entry.racesPlayed).toFixed(1)
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={i === 0 ? "default" : "secondary"}>
                {entry.totalPoints}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No data yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
