import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { races, riders, teams, predictions, raceResults, scores, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionForm } from "@/components/predictions/prediction-form";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { calculateScore } from "@/lib/scoring";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

async function getRidersWithTeams() {
  const allRiders = await db.query.riders.findMany({
    where: eq(riders.season, 2026),
  });
  const allTeams = await db.query.teams.findMany({
    where: eq(teams.season, 2026),
  });
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  return allRiders.map((r) => ({ ...r, team: teamMap.get(r.teamId)! }));
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("race");
  const tPred = await getTranslations("prediction");
  const tAdmin = await getTranslations("admin");
  const session = await auth();

  const race = await db.query.races.findFirst({
    where: eq(races.id, id),
  });
  if (!race) notFound();

  const ridersWithTeams = await getRidersWithTeams();
  const riderMap = new Map(ridersWithTeams.map((r) => [r.id, r]));

  // Get user's prediction
  let userPrediction = null;
  if (session?.user?.id) {
    userPrediction = await db.query.predictions.findFirst({
      where: and(
        eq(predictions.userId, session.user.id),
        eq(predictions.raceId, id)
      ),
    });
  }

  // Get race results
  const result = await db.query.raceResults.findFirst({
    where: eq(raceResults.raceId, id),
  });

  // Determine if we should hide results (No Spoiler mode)
  // Hide results when: results exist, user is logged in, but hasn't predicted yet
  const hideResults = !!result && !!session?.user && !userPrediction;

  // Get all predictions for this race (show after user made prediction)
  const allPredictions = await db.query.predictions.findMany({
    where: eq(predictions.raceId, id),
  });

  // Get user names
  const allUsers = await db.query.users.findMany();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // Get scores for this race
  const raceScores = await db.query.scores.findMany({
    where: eq(scores.raceId, id),
  });
  const scoreMap = new Map(raceScores.map((s) => [s.userId, s]));

  const totalRaces = 22;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Race Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("round", { round: race.round, total: totalRaces })}
            </p>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {countryFlag(race.countryCode)}{" "}
              {locale === "it" ? race.nameIt : race.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {locale === "it" ? race.circuitIt : race.circuit}
            </p>
          </div>
          {race.trackImage && (
            <div className="w-40 h-40 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={race.trackImage}
                alt="Track layout"
                className="w-full h-full object-contain"
                style={{ filter: "brightness(0)", opacity: 0.3 }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-medium">
            {new Date(race.date).toLocaleDateString(
              locale === "it" ? "it-IT" : "en-US",
              { weekday: "long", day: "numeric", month: "long", year: "numeric" }
            )}
          </p>
          {race.status !== "scheduled" && (
            <Badge variant={race.status === "cancelled" ? "destructive" : "secondary"}>
              {race.status}
            </Badge>
          )}
          {race.isResultConfirmed && (
            <Badge className="bg-green-600">{tAdmin("raceCompleted")}</Badge>
          )}
        </div>
        {race.officialResultsUrl && (
          <a
            href={race.officialResultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t("viewOfficialResults")}
          </a>
        )}
      </div>

      {/* No Spoiler Banner - when results exist but user hasn't predicted */}
      {hideResults && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="py-6 flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-700">{tAdmin("noSpoiler")}</p>
              <p className="text-sm text-orange-600">{tAdmin("noSpoilerDescription")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Official Results - only show when user has predicted (or not logged in) */}
      {result && !hideResults && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-700">{t("officialResults")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionCard
              title={t("podium")}
              podium={[
                { rider: riderMap.get(result.position1RiderId)! },
                { rider: riderMap.get(result.position2RiderId)! },
                { rider: riderMap.get(result.position3RiderId)! },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Prediction Form / User's Prediction - never locked */}
        <div>
          {session?.user ? (
            <PredictionForm
              raceId={id}
              riders={ridersWithTeams}
              existing={userPrediction}
              locked={!!result && !!userPrediction}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">{t("noPrediction")}</p>
                <Link href={`/${locale}/auth/login`}>
                  <Button className="bg-red-600 hover:bg-red-700">Login</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Other Predictions - only show if user has predicted */}
        <div className="space-y-4">
          {userPrediction && allPredictions.length > 0 && (
            <>
              <h2 className="text-lg font-semibold">{t("otherPredictions")}</h2>
              {allPredictions
                .filter((p) => p.userId !== session?.user?.id)
                .map((pred) => {
                  const user = userMap.get(pred.userId);
                  const score = scoreMap.get(pred.userId);

                  let podiumWithPoints: [
                    { rider: typeof ridersWithTeams[0]; points?: number },
                    { rider: typeof ridersWithTeams[0]; points?: number },
                    { rider: typeof ridersWithTeams[0]; points?: number }
                  ];

                  if (result) {
                    const calc = calculateScore(
                      { pos1: pred.position1RiderId, pos2: pred.position2RiderId, pos3: pred.position3RiderId },
                      { pos1: result.position1RiderId, pos2: result.position2RiderId, pos3: result.position3RiderId }
                    );
                    podiumWithPoints = [
                      { rider: riderMap.get(pred.position1RiderId)!, points: calc.pos1 },
                      { rider: riderMap.get(pred.position2RiderId)!, points: calc.pos2 },
                      { rider: riderMap.get(pred.position3RiderId)!, points: calc.pos3 },
                    ];
                  } else {
                    podiumWithPoints = [
                      { rider: riderMap.get(pred.position1RiderId)! },
                      { rider: riderMap.get(pred.position2RiderId)! },
                      { rider: riderMap.get(pred.position3RiderId)! },
                    ];
                  }

                  return (
                    <PredictionCard
                      key={pred.id}
                      title={user?.nickname || user?.name || "User"}
                      podium={podiumWithPoints}
                      showPoints={!!result}
                      totalPoints={score?.points}
                    />
                  );
                })}

              {/* Show user's own prediction as card too */}
              {result && userPrediction && (
                <PredictionCard
                  title={`${t("yourPrediction")}`}
                  podium={(() => {
                    const calc = calculateScore(
                      { pos1: userPrediction.position1RiderId, pos2: userPrediction.position2RiderId, pos3: userPrediction.position3RiderId },
                      { pos1: result.position1RiderId, pos2: result.position2RiderId, pos3: result.position3RiderId }
                    );
                    return [
                      { rider: riderMap.get(userPrediction.position1RiderId)!, points: calc.pos1 },
                      { rider: riderMap.get(userPrediction.position2RiderId)!, points: calc.pos2 },
                      { rider: riderMap.get(userPrediction.position3RiderId)!, points: calc.pos3 },
                    ];
                  })()}
                  showPoints
                  totalPoints={scoreMap.get(session!.user!.id)?.points}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
