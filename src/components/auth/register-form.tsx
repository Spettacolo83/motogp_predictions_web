"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { registerUser, validateInvitationCode } from "@/actions/auth";
import Link from "next/link";

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show error from URL params (e.g., redirect from Google sign-in failure)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "notRegistered") {
      setError(t("notRegistered"));
    } else if (urlError === "invalidInvitationCode") {
      setError(t("invalidInvitationCode"));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      setError(t(result.error as string));
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (signInResult?.error) {
      router.push(`/${locale}/auth/login`);
    } else {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    if (!invitationCode.trim()) {
      setError(t("invalidInvitationCode"));
      return;
    }

    setGoogleLoading(true);
    setError(null);

    // Validate invitation code server-side and set cookie
    const result = await validateInvitationCode(invitationCode.trim());

    if (result.error) {
      setError(t(result.error as string));
      setGoogleLoading(false);
      return;
    }

    // Code is valid and saved in cookie, proceed with Google sign-in
    signIn("google", { callbackUrl: `/${locale}` });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Invitation code - required for both flows */}
        <div className="space-y-2">
          <Label htmlFor="invitationCodeTop">{t("invitationCode")}</Label>
          <Input
            id="invitationCodeTop"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            required
            placeholder={t("invitationCodePlaceholder")}
          />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={googleLoading || !invitationCode.trim()}
        >
          {googleLoading ? (
            "..."
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("loginWithGoogle")}
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">{t("nickname")}</Label>
            <Input
              id="nickname"
              name="nickname"
              required
              minLength={2}
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
          </div>
          {/* Hidden field to sync invitation code to form */}
          <input type="hidden" name="invitationCode" value={invitationCode} />
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading || !invitationCode.trim()}
          >
            {loading ? "..." : t("registerTitle")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/auth/login`} className="text-red-600 hover:underline font-medium">
            {t("signInLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
