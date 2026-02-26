import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { races, scores, predictions } from "@/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, BarChart3, Target } from "lucide-react";

// Country code to flag emoji
function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const session = await auth();

  // Get all races ordered by round
  const allRaces = await db.query.races.findMany({
    orderBy: (r, { asc }) => [asc(r.round)],
    where: eq(races.season, 2026),
  });

  const today = new Date().toISOString().split("T")[0];
  const nextRace = allRaces.find(
    (r) => r.date >= today && r.status !== "cancelled"
  );

  // User stats
  let userStats = null;
  if (session?.user?.id) {
    const userScores = await db
      .select({ total: sql<number>`SUM(${scores.points})` })
      .from(scores)
      .where(eq(scores.userId, session.user.id));

    const userPredictions = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(predictions)
      .where(eq(predictions.userId, session.user.id));

    userStats = {
      totalPoints: userScores[0]?.total ?? 0,
      predictionsCount: userPredictions[0]?.count ?? 0,
    };
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>
        {!session && (
          <div className="flex gap-3 justify-center">
            <Link href={`/${locale}/auth/register`}>
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                {t("makePrediction")}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Next Race */}
      {nextRace && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Target className="h-5 w-5" />
              {t("nextRace")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {nextRace.trackImage && (
                  <div className="hidden sm:block w-48 h-48 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nextRace.trackImage}
                      alt="Track layout"
                      className="w-full h-full object-contain"
                      style={{ filter: "brightness(0)", opacity: 0.25 }}
                    />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold">
                    {countryFlag(nextRace.countryCode)}{" "}
                    {locale === "it" ? nextRace.nameIt : nextRace.name}
                  </p>
                  <p className="text-muted-foreground">
                    {locale === "it" ? nextRace.circuitIt : nextRace.circuit} &middot;{" "}
                    {new Date(nextRace.date).toLocaleDateString(
                      locale === "it" ? "it-IT" : "en-US",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
              {session && (
                <Link href={`/${locale}/race/${nextRace.id}`}>
                  <Button className="bg-red-600 hover:bg-red-700">
                    {t("makePrediction")}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {session && userStats && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("totalPoints")}
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userStats.totalPoints}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("predictionsCount")}
                </CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {userStats.predictionsCount}
                </p>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex gap-4">
              <Link href={`/${locale}/calendar`}>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("viewCalendar")}
                </Button>
              </Link>
              <Link href={`/${locale}/leaderboard`}>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("viewLeaderboard")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
