"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addWildcardRider, deleteRider } from "@/actions/admin";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Rider, Team } from "@/db/schema";

interface Props {
  teams: Team[];
  wildcards: (Rider & { team: Team })[];
}

export function WildcardForm({ teams, wildcards }: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addWildcardRider(fd);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("wildcardAdded"));
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  const handleDelete = (riderId: string) => {
    startTransition(async () => {
      await deleteRider(riderId);
      toast.success(t("riderDeleted"));
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing wildcards */}
      {wildcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("wildcardRiders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wildcards.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">
                      #{rider.number} {rider.firstName} {rider.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rider.team.name} &middot; {rider.nationality}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(rider.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {wildcards.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("noWildcards")}</p>
      )}

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("addWildcard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("riderNumber")}</Label>
              <Input name="number" type="number" required min={1} />
            </div>
            <div className="space-y-2">
              <Label>{t("firstName")}</Label>
              <Input name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label>{t("lastName")}</Label>
              <Input name="lastName" required />
            </div>
            <div className="space-y-2">
              <Label>{t("nationality")}</Label>
              <Input name="nationality" required placeholder="IT, ES, FR..." maxLength={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("team")}</Label>
              <Select name="teamId" required>
                <SelectTrigger>
                  <SelectValue placeholder={t("team")} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.fullName} ({team.manufacturer})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700">
                {isPending ? "..." : t("addWildcard")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
