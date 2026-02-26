import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, user.id),
  });

  const hasGoogle = userAccounts.some((a) => a.provider === "google");

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileForm
        user={{
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          hasGoogle,
          hasPassword: !!user.passwordHash,
        }}
      />
    </div>
  );
}
