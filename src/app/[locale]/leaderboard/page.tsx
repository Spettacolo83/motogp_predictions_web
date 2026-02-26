import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { scores, users, races } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { StandingsTable, type StandingEntry } from "@/components/leaderboard/standings-table";
import { PositionChart } from "@/components/leaderboard/position-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = [
  "#e11d48", "#2563eb", "#16a34a", "#d97706", "#9333ea",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("leaderboard");

  // Get standings
  const standingsRaw = await db
    .select({
      userId: scores.userId,
      totalPoints: sql<number>`SUM(${scores.points})`,
      racesPlayed: sql<number>`COUNT(${scores.raceId})`,
    })
    .from(scores)
    .groupBy(scores.userId)
    .orderBy(desc(sql`SUM(${scores.points})`));

  const allUsers = await db.query.users.findMany();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const standings: StandingEntry[] = standingsRaw.map((s) => ({
    userId: s.userId,
    nickname: userMap.get(s.userId)?.nickname || userMap.get(s.userId)?.name || "User",
    totalPoints: s.totalPoints,
    racesPlayed: s.racesPlayed,
  }));

  // Get chart data: position per race
  const confirmedRaces = await db.query.races.findMany({
    where: eq(races.isResultConfirmed, true),
    orderBy: (r, { asc }) => [asc(r.round)],
  });

  const allScores = await db.query.scores.findMany();

  // Build cumulative points per race
  const chartData: { race: string; [key: string]: number | string }[] = [];
  const cumulativePoints: Record<string, number> = {};
  const playerNames = standings.map((s) => s.nickname);

  for (const race of confirmedRaces) {
    const raceLabel = `R${race.round}`;
    const raceScores = allScores.filter((s) => s.raceId === race.id);

    for (const s of raceScores) {
      const name =
        userMap.get(s.userId)?.nickname || userMap.get(s.userId)?.name || "User";
      cumulativePoints[name] = (cumulativePoints[name] || 0) + s.points;
    }

    // Store cumulative points for each player
    const entry: { race: string; [key: string]: number | string } = { race: raceLabel };
    for (const name of playerNames) {
      if (cumulativePoints[name]) {
        entry[name] = cumulativePoints[name];
      }
    }

    chartData.push(entry);
  }

  const players = playerNames.map((name, i) => ({
    name,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="standings">
        <TabsList>
          <TabsTrigger value="standings">{t("totalPoints")}</TabsTrigger>
          <TabsTrigger value="chart">{t("positionHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <Card>
            <CardContent className="p-0">
              <StandingsTable standings={standings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>{t("positionHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PositionChart data={chartData} players={players} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
