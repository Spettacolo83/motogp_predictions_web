"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adminUpdateUser, adminDeleteUser, adminVerifyUser, adminResendVerification } from "@/actions/admin";
import { updateProfileImage } from "@/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Shield, Mail, ClipboardList, CheckCircle, Clock, Camera, X } from "lucide-react";
import type { User } from "@/db/schema";

type UserWithMeta = User & {
  provider: string;
  predictionsCount: number;
};

interface Props {
  users: UserWithMeta[];
  currentUserId: string;
}

function UserRow({
  user,
  currentUserId,
  isPending,
  startTransition,
}: {
  user: UserWithMeta;
  currentUserId: string;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [nickname, setNickname] = useState(user.nickname || "");
  const [role, setRole] = useState(user.role);
  const [avatarUrl, setAvatarUrl] = useState(user.image);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isSelf = user.id === currentUserId;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("uploadFailed"));
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("userId", user.id);
    try {
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        toast.success(t("userUpdated"));
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

  const handleRemoveAvatar = () => {
    startTransition(async () => {
      const result = await updateProfileImage(user.id, null);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        setAvatarUrl(null);
        toast.success(t("avatarRemoved"));
        router.refresh();
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const data: { nickname?: string; role?: "user" | "admin" } = {};
      if (nickname !== (user.nickname || "")) data.nickname = nickname;
      if (role !== user.role) data.role = role as "user" | "admin";

      if (Object.keys(data).length === 0) {
        setEditOpen(false);
        return;
      }

      const result = await adminUpdateUser(user.id, data);
      if (result.error) {
        toast.error(t(result.error as "cannotChangeSelfRole" | "nicknameExists"));
      } else {
        toast.success(t("userUpdated"));
        setEditOpen(false);
      }
    });
  };

  const handleDelete = () => {
    if (isSelf) {
      toast.error(t("cannotDeleteSelf"));
      return;
    }
    if (!confirm(t("deleteUserConfirm"))) return;
    startTransition(async () => {
      const result = await adminDeleteUser(user.id);
      if (result.error) {
        toast.error(t(result.error as "cannotDeleteSelf"));
      } else {
        toast.success(t("userDeleted"));
      }
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      {/* Avatar */}
      {user.image ? (
        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
          {(user.nickname || user.name || "?").charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">
            {user.nickname || user.name || "—"}
          </p>
          {user.role === "admin" && (
            <Badge className="bg-red-600 text-[10px] px-1.5 py-0">Admin</Badge>
          )}
          {isSelf && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">You</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-2 flex-wrap">
          <span>{user.email}</span>
          <span>&middot;</span>
          <span className="capitalize">{user.provider === "credentials" ? "Email" : "Google"}</span>
          <span>&middot;</span>
          <span>{user.predictionsCount} {t("predictionsCount")}</span>
          {user.provider === "credentials" && (
            user.emailVerified ? (
              <Badge className="bg-green-600 text-[10px] px-1.5 py-0">
                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                {t("verified")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] px-1.5 py-0">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {t("pendingVerification")}
              </Badge>
            )
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editUser")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* User info with editable avatar */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <div className="h-14 w-14 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                      {(user.nickname || user.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 transition-colors"
                    disabled={uploading}
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{user.name || "—"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    {user.predictionsCount} {t("predictionsCount")}
                  </p>
                  {avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="text-xs text-destructive hover:underline flex items-center gap-1 mt-1"
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                      {t("removeAvatar")}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("userNickname")}</Label>
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>{t("userRole")}</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")} disabled={isSelf}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && (
                  <p className="text-xs text-muted-foreground">{t("cannotChangeSelfRole")}</p>
                )}
              </div>

              {user.provider === "credentials" && !user.emailVerified && (
                <div className="space-y-2 border-t pt-4">
                  <Label>{t("emailVerification")}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startTransition(async () => {
                          const result = await adminVerifyUser(user.id);
                          if (result.error) toast.error(t(result.error as string));
                          else {
                            toast.success(t("userVerified"));
                            setEditOpen(false);
                          }
                        });
                      }}
                      disabled={isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {t("verifyManually")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startTransition(async () => {
                          const result = await adminResendVerification(user.id);
                          if (result.error) toast.error(t(result.error as string));
                          else toast.success(t("verificationEmailSent"));
                        });
                      }}
                      disabled={isPending}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      {t("resendVerification")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {t("memberSince")}: {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
                {" "}&middot; {t("accountType")}: {user.provider === "credentials" ? "Email" : "Google"}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={isPending} className="bg-red-600 hover:bg-red-700">
                {isPending ? "..." : t("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {!isSelf && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function UsersManagement({ users, currentUserId }: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();

  const adminUsers = users.filter((u) => u.role === "admin");
  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <div className="space-y-6">
      {/* Admin users */}
      {adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Admin ({adminUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {adminUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                isPending={isPending}
                startTransition={startTransition}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Regular users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("usersLabel")} ({regularUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {regularUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("noUsers")}</p>
          ) : (
            regularUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                isPending={isPending}
                startTransition={startTransition}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
