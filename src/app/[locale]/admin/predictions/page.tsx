import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { predictions, users, races, riders, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredictionActions } from "@/components/admin/prediction-actions";
import Link from "next/link";

export default async function AdminPredictionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("admin");

  if (!session?.user || session.user.role !== "admin") {
    redirect(`/${locale}`);
  }

  const allPredictions = await db.query.predictions.findMany();
  const allUsers = await db.query.users.findMany();
  const allRaces = await db.query.races.findMany({
    orderBy: (r, { asc }) => [asc(r.round)],
  });
  const allRiders = await db.query.riders.findMany({ where: eq(riders.season, 2026) });
  const allTeams = await db.query.teams.findMany({ where: eq(teams.season, 2026) });

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const raceMap = new Map(allRaces.map((r) => [r.id, r]));
  const riderMap = new Map(allRiders.map((r) => [r.id, r]));
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));

  const ridersWithTeams = allRiders.map((r) => ({
    ...r,
    team: teamMap.get(r.teamId)!,
  }));

  // Group predictions by race
  const predsByRace = new Map<string, typeof allPredictions>();
  for (const pred of allPredictions) {
    const existing = predsByRace.get(pred.raceId) || [];
    existing.push(pred);
    predsByRace.set(pred.raceId, existing);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {t("dashboard")}
        </Link>
      </div>
      <h1 className="text-3xl font-bold">{t("managePredictions")}</h1>

      {allRaces.map((race) => {
        const preds = predsByRace.get(race.id) || [];
        if (preds.length === 0) return null;

        return (
          <Card key={race.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                R{race.round} - {locale === "it" ? race.nameIt : race.name}
                <Badge variant="secondary">{preds.length}</Badge>
                {race.isResultConfirmed && (
                  <Badge className="bg-green-600">Confirmed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {preds.map((pred) => {
                  const user = userMap.get(pred.userId);
                  return (
                    <div
                      key={pred.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-sm">
                          {user?.nickname || user?.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          1. {riderMap.get(pred.position1RiderId)?.lastName} /{" "}
                          2. {riderMap.get(pred.position2RiderId)?.lastName} /{" "}
                          3. {riderMap.get(pred.position3RiderId)?.lastName}
                        </p>
                      </div>
                      <PredictionActions
                        predictionId={pred.id}
                        raceId={race.id}
                        currentPos1={pred.position1RiderId}
                        currentPos2={pred.position2RiderId}
                        currentPos3={pred.position3RiderId}
                        riders={ridersWithTeams}
                        isResultConfirmed={race.isResultConfirmed}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
