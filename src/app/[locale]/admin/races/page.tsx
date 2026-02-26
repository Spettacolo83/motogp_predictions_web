import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { races } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RaceManagementCard } from "@/components/admin/race-management-card";
import Link from "next/link";

export default async function AdminRacesPage({
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

  const allRaces = await db.query.races.findMany({
    orderBy: (r, { asc }) => [asc(r.round)],
    where: eq(races.season, 2026),
  });

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
      <h1 className="text-3xl font-bold">{t("manageRaces")}</h1>

      <Card>
        <CardContent className="p-4 space-y-2">
          {allRaces.map((race) => (
            <RaceManagementCard key={race.id} race={race} locale={locale} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
