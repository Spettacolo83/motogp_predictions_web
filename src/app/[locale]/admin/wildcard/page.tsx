import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { riders, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { RidersManagement } from "@/components/admin/riders-management";
import Link from "next/link";

export default async function AdminRidersPage({
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

  const allTeams = await db.query.teams.findMany({
    where: eq(teams.season, 2026),
    orderBy: (t, { asc }) => [asc(t.manufacturer), asc(t.name)],
  });

  const allRiders = await db.query.riders.findMany({
    where: eq(riders.season, 2026),
    orderBy: (r, { asc }) => [asc(r.lastName)],
  });

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const ridersWithTeams = allRiders.map((r) => ({
    ...r,
    team: teamMap.get(r.teamId)!,
  }));

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
      <h1 className="text-3xl font-bold">{t("manageRiders")}</h1>
      <RidersManagement teams={allTeams} riders={ridersWithTeams} />
    </div>
  );
}
