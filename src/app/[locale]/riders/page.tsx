import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { riders, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TeamSection } from "@/components/riders/team-section";

const MANUFACTURER_ORDER = ["Ducati", "Aprilia", "KTM", "Yamaha", "Honda"];

const MANUFACTURER_COLORS: Record<string, string> = {
  Ducati: "#CC0000",
  Aprilia: "#41424C",
  KTM: "#FF6600",
  Yamaha: "#0D47A1",
  Honda: "#FF8C00",
};

export default async function RidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("riders");

  const allTeams = await db.query.teams.findMany({
    where: eq(teams.season, 2026),
  });

  const allRiders = await db.query.riders.findMany({
    where: and(eq(riders.season, 2026), eq(riders.isActive, true)),
  });

  // Group by manufacturer
  const byManufacturer = new Map<string, { teams: typeof allTeams; riders: Map<string, typeof allRiders> }>();

  for (const manufacturer of MANUFACTURER_ORDER) {
    const mfTeams = allTeams
      .filter((t) => t.manufacturer === manufacturer)
      .sort((a, b) => (a.isFactory ? -1 : 1) - (b.isFactory ? -1 : 1));

    const ridersByTeam = new Map<string, typeof allRiders>();
    for (const team of mfTeams) {
      ridersByTeam.set(
        team.id,
        allRiders.filter((r) => r.teamId === team.id)
      );
    }

    byManufacturer.set(manufacturer, { teams: mfTeams, riders: ridersByTeam });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {MANUFACTURER_ORDER.map((manufacturer) => {
        const data = byManufacturer.get(manufacturer);
        if (!data) return null;

        return (
          <div key={manufacturer} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: MANUFACTURER_COLORS[manufacturer] }}
              />
              {manufacturer}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.teams.map((team) => (
                <TeamSection
                  key={team.id}
                  team={team}
                  riders={data.riders.get(team.id) || []}
                  locale={locale}
                  factoryLabel={t("factory")}
                  satelliteLabel={t("satellite")}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
