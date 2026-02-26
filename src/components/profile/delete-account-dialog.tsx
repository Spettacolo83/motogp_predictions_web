"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteUser } from "@/actions/auth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteAccountDialog({ userId }: { userId: string }) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);

  const confirmWord = locale === "it" ? "ELIMINA" : "DELETE";
  const isConfirmed = confirmation === confirmWord;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("accountDeleted"));
        await signOut({ callbackUrl: `/${locale}` });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {t("deleteAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteAccount")}</DialogTitle>
          <DialogDescription>{t("deleteAccountWarning")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">
            {t("deleteConfirmation")}
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={confirmWord}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {locale === "it" ? "Annulla" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || isPending}
            >
              {isPending ? "..." : t("deleteAccount")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
