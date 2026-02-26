import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { races } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RaceCard } from "@/components/calendar/race-card";

export default async function CalendarPage() {
  const t = await getTranslations("calendar");

  const allRaces = await db.query.races.findMany({
    orderBy: (r, { asc }) => [asc(r.round)],
    where: eq(races.season, 2026),
  });

  const today = new Date().toISOString().split("T")[0];
  const nextRaceIndex = allRaces.findIndex(
    (r) => r.date >= today && r.status !== "cancelled"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allRaces.map((race, i) => (
          <RaceCard
            key={race.id}
            race={race}
            isNext={i === nextRaceIndex}
            isCompleted={race.isResultConfirmed}
          />
        ))}
      </div>
    </div>
  );
}
