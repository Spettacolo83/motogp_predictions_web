import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { EmailVerificationRequired } from "@/components/auth/email-verification-required";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const session = await auth();

  const needsVerification =
    session?.user &&
    session.user.isCredentials &&
    !session.user.isEmailVerified;

  return (
    <SessionProvider session={session}>
      <NextIntlClientProvider>
        <Header />
        <main className="container mx-auto px-4 py-6">
          {needsVerification ? <EmailVerificationRequired /> : children}
        </main>
        <Toaster />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
