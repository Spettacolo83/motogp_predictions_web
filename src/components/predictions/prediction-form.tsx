"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePrediction } from "@/actions/predictions";
import { toast } from "sonner";
import type { Rider, Team, Prediction } from "@/db/schema";

interface Props {
  raceId: string;
  riders: (Rider & { team: Team })[];
  existing?: Prediction | null;
  locked: boolean;
}

export function PredictionForm({ raceId, riders, existing, locked }: Props) {
  const t = useTranslations("prediction");
  const [isPending, startTransition] = useTransition();
  const [pos1, setPos1] = useState(existing?.position1RiderId || "");
  const [pos2, setPos2] = useState(existing?.position2RiderId || "");
  const [pos3, setPos3] = useState(existing?.position3RiderId || "");
  const [error, setError] = useState<string | null>(null);

  const selected = [pos1, pos2, pos3].filter(Boolean);

  const getAvailable = (current: string) =>
    riders.filter((r) => r.isActive && (!selected.includes(r.id) || r.id === current));

  const handleSubmit = () => {
    if (!pos1 || !pos2 || !pos3) return;
    if (new Set([pos1, pos2, pos3]).size !== 3) {
      setError(t("sameRiderError"));
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("raceId", raceId);
    fd.set("position1RiderId", pos1);
    fd.set("position2RiderId", pos2);
    fd.set("position3RiderId", pos3);

    startTransition(async () => {
      const result = await savePrediction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(result.isUpdate ? t("updated") : t("saved"));
      }
    });
  };

  if (locked) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {t("locked")}
        </CardContent>
      </Card>
    );
  }

  const riderOption = (rider: Rider & { team: Team }) => (
    <SelectItem key={rider.id} value={rider.id}>
      #{rider.number} {rider.firstName} {rider.lastName}{" "}
      <span className="text-muted-foreground">({rider.team.name})</span>
    </SelectItem>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existing ? t("editPrediction") : t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
              1
            </span>
            {t("position1")}
          </Label>
          <Select value={pos1} onValueChange={setPos1}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectRider")} />
            </SelectTrigger>
            <SelectContent>
              {getAvailable(pos1).map(riderOption)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-black">
              2
            </span>
            {t("position2")}
          </Label>
          <Select value={pos2} onValueChange={setPos2}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectRider")} />
            </SelectTrigger>
            <SelectContent>
              {getAvailable(pos2).map(riderOption)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-xs font-bold text-white">
              3
            </span>
            {t("position3")}
          </Label>
          <Select value={pos3} onValueChange={setPos3}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectRider")} />
            </SelectTrigger>
            <SelectContent>
              {getAvailable(pos3).map(riderOption)}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!pos1 || !pos2 || !pos3 || isPending}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {isPending ? "..." : existing ? t("editPrediction") : t("savePrediction")}
        </Button>
      </CardContent>
    </Card>
  );
}
