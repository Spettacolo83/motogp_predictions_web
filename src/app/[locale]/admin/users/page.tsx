import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts, predictions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UsersManagement } from "@/components/admin/users-management";
import Link from "next/link";

export default async function AdminUsersPage({
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

  const allUsers = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });

  // Get account providers for each user
  const allAccounts = await db.query.accounts.findMany();
  const accountMap = new Map<string, string>();
  for (const acc of allAccounts) {
    accountMap.set(acc.userId, acc.provider);
  }

  // Get prediction counts per user
  const predCounts = await db
    .select({
      userId: predictions.userId,
      count: sql<number>`COUNT(*)`,
    })
    .from(predictions)
    .groupBy(predictions.userId);
  const predCountMap = new Map(predCounts.map((p) => [p.userId, p.count]));

  const usersWithMeta = allUsers.map((u) => ({
    ...u,
    provider: accountMap.get(u.id) || (u.passwordHash ? "credentials" : "unknown"),
    predictionsCount: predCountMap.get(u.id) || 0,
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
      <h1 className="text-3xl font-bold">{t("manageUsers")}</h1>
      <UsersManagement
        users={usersWithMeta}
        currentUserId={session.user.id}
      />
    </div>
  );
}
