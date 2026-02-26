import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { races, riders, teams, raceResults, predictions, users, scores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { AdminResultsForm } from "./results-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export default async function AdminResultsPage({
  params,
}: {
  params: Promise<{ locale: string; raceId: string }>;
}) {
  const { locale, raceId } = await params;
  const session = await auth();
  const t = await getTranslations("admin");

  if (!session?.user || session.user.role !== "admin") {
    redirect(`/${locale}`);
  }

  const race = await db.query.races.findFirst({
    where: eq(races.id, raceId),
  });
  if (!race) notFound();

  const allRiders = await db.query.riders.findMany({
    where: eq(riders.season, 2026),
  });
  const allTeams = await db.query.teams.findMany({
    where: eq(teams.season, 2026),
  });
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const ridersWithTeams = allRiders.map((r) => ({
    ...r,
    team: teamMap.get(r.teamId)!,
  }));

  const existingResult = await db.query.raceResults.findFirst({
    where: eq(raceResults.raceId, raceId),
  });

  // Get predictions for this race with user info
  const racePredictions = await db.query.predictions.findMany({
    where: eq(predictions.raceId, raceId),
  });
  const allUsers = await db.query.users.findMany();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const riderMap = new Map(ridersWithTeams.map((r) => [r.id, r]));

  const raceScores = await db.query.scores.findMany({
    where: eq(scores.raceId, raceId),
  });
  const scoreMap = new Map(raceScores.map((s) => [s.userId, s]));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {t("dashboard")}
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {countryFlag(race.countryCode)}{" "}
          {locale === "it" ? race.nameIt : race.name}
        </h1>
        <p className="text-muted-foreground">
          Round {race.round} &middot;{" "}
          {new Date(race.date).toLocaleDateString(
            locale === "it" ? "it-IT" : "en-US",
            { day: "numeric", month: "long", year: "numeric" }
          )}
        </p>
        {race.officialResultsUrl && (
          <a
            href={race.officialResultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View official results
          </a>
        )}
      </div>

      <AdminResultsForm
        raceId={raceId}
        riders={ridersWithTeams}
        existingResult={existingResult}
      />

      {/* Predictions summary */}
      {racePredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Predictions ({racePredictions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {racePredictions.map((pred) => {
                const user = userMap.get(pred.userId);
                const score = scoreMap.get(pred.userId);
                return (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {user?.nickname || user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1. {riderMap.get(pred.position1RiderId)?.lastName} &middot;{" "}
                        2. {riderMap.get(pred.position2RiderId)?.lastName} &middot;{" "}
                        3. {riderMap.get(pred.position3RiderId)?.lastName}
                      </p>
                    </div>
                    {score && (
                      <Badge variant="secondary">{score.points} pts</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
