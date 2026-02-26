import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { races, users, predictions, scores } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, Target, CheckCircle, Clock, CalendarDays, ClipboardList, UserPlus } from "lucide-react";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export default async function AdminPage({
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

  const allUsers = await db.query.users.findMany();
  const totalPredictions = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(predictions);
  const allRaces = await db.query.races.findMany({
    orderBy: (r, { asc }) => [asc(r.round)],
    where: eq(races.season, 2026),
  });
  const confirmedCount = allRaces.filter((r) => r.isResultConfirmed).length;
  const pendingCount = allRaces.filter(
    (r) => !r.isResultConfirmed && r.status !== "cancelled"
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalUsers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalPredictions")}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPredictions[0]?.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("confirmedRaces")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingRaces")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${locale}/admin/predictions`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{t("managePredictions")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/admin/races`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <CalendarDays className="h-5 w-5 text-orange-500" />
              <span className="font-medium">{t("manageRaces")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/admin/wildcard`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <UserPlus className="h-5 w-5 text-purple-500" />
              <span className="font-medium">{t("manageRiders")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/admin/users`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="h-5 w-5 text-green-500" />
              <span className="font-medium">{t("manageUsers")}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Race list */}
      <Card>
        <CardHeader>
          <CardTitle>{t("manageResults")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allRaces.map((race) => (
              <Link
                key={race.id}
                href={`/${locale}/admin/results/${race.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{countryFlag(race.countryCode)}</span>
                  <div>
                    <p className="font-medium text-sm">
                      R{race.round} - {locale === "it" ? race.nameIt : race.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(race.date).toLocaleDateString(
                        locale === "it" ? "it-IT" : "en-US",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {race.status !== "scheduled" && (
                    <Badge
                      variant={
                        race.status === "cancelled" ? "destructive" : "secondary"
                      }
                    >
                      {race.status}
                    </Badge>
                  )}
                  {race.isResultConfirmed ? (
                    <Badge className="bg-green-600">{t("editResults")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("enterResults")}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
