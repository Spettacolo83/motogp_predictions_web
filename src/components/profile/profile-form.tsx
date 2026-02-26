"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { updateNickname } from "@/actions/auth";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { toast } from "sonner";
import { Camera, Upload } from "lucide-react";

interface Props {
  user: {
    id: string;
    nickname: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    hasGoogle: boolean;
    hasPassword: boolean;
  };
}

export function ProfileForm({ user }: Props) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nickname, setNickname] = useState(user.nickname || "");
  const [avatarUrl, setAvatarUrl] = useState(user.image);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNicknameSubmit = () => {
    startTransition(async () => {
      const result = await updateNickname(user.id, nickname);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("nicknameSaved"));
        router.refresh();
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("maxFileSize"));
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        toast.success(t("imageSaved"));
        router.refresh();
      } else {
        toast.error(t("uploadFailed"));
      }
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("changeAvatar")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {(user.nickname || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700 transition-colors"
              disabled={uploading}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "..." : t("uploadImage")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("maxFileSize")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Nickname */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("changeNickname")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">{t("newNickname")}</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={20}
              />
              <Button
                onClick={handleNicknameSubmit}
                disabled={isPending || nickname.trim().length < 2}
                className="bg-red-600 hover:bg-red-700"
              >
                {isPending ? "..." : t("changeNickname")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("accountInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t("email")}</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              {t("accountType")}
            </span>
            <span className="text-sm font-medium">
              {user.hasGoogle ? t("googleAccount") : t("emailAccount")}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              {t("memberSince")}
            </span>
            <span className="text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString(
                locale === "it" ? "it-IT" : "en-US",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">
            {t("dangerZone")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("deleteAccountWarning")}
          </p>
          <DeleteAccountDialog userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
