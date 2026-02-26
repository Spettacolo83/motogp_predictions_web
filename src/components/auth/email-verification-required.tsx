"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { resendVerificationEmail } from "@/actions/auth";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export function EmailVerificationRequired() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    startTransition(async () => {
      const result = await resendVerificationEmail();
      if (result.error === "rateLimited") {
        toast.error(t("resendRateLimited"));
      } else if (result.error) {
        toast.error(t("resendFailed"));
      } else {
        setResent(true);
        toast.success(t("verificationEmailSent"));
        setTimeout(() => setResent(false), 60000);
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">{t("verifyEmailTitle")}</CardTitle>
          <CardDescription>{t("verifyEmailDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleResend}
            disabled={isPending || resent}
            variant="outline"
            className="w-full"
          >
            {resent ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("verificationEmailSent")}
              </>
            ) : isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                {t("resendVerificationEmail")}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          >
            {t("useAnotherAccount")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
