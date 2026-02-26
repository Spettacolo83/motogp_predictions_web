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
import { saveResults, recalculateScores, deleteRaceResults } from "@/actions/results";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Rider, Team, RaceResult } from "@/db/schema";

interface Props {
  raceId: string;
  riders: (Rider & { team: Team })[];
  existingResult?: RaceResult | null;
}

export function AdminResultsForm({ raceId, riders, existingResult }: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [pos1, setPos1] = useState(existingResult?.position1RiderId || "");
  const [pos2, setPos2] = useState(existingResult?.position2RiderId || "");
  const [pos3, setPos3] = useState(existingResult?.position3RiderId || "");

  const selected = [pos1, pos2, pos3].filter(Boolean);
  const getAvailable = (current: string) =>
    riders.filter(
      (r) => r.isActive && (!selected.includes(r.id) || r.id === current)
    );

  const handleSubmit = () => {
    if (!pos1 || !pos2 || !pos3) return;

    const fd = new FormData();
    fd.set("raceId", raceId);
    fd.set("position1RiderId", pos1);
    fd.set("position2RiderId", pos2);
    fd.set("position3RiderId", pos3);

    startTransition(async () => {
      const result = await saveResults(fd);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("resultsConfirmed"));
      }
    });
  };

  const handleRecalculate = () => {
    startTransition(async () => {
      const result = await recalculateScores(raceId);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("recalculated"));
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(t("deleteResultsConfirm"))) return;
    startTransition(async () => {
      const result = await deleteRaceResults(raceId);
      if (result.error) {
        toast.error(t(result.error as string));
      } else {
        toast.success(t("resultsDeleted"));
        setPos1("");
        setPos2("");
        setPos3("");
      }
    });
  };

  const riderOption = (rider: Rider & { team: Team }) => (
    <SelectItem key={rider.id} value={rider.id}>
      #{rider.number} {rider.firstName} {rider.lastName} ({rider.team.name})
    </SelectItem>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingResult ? t("editResults") : t("enterResults")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
              1
            </span>
            1st Place
          </Label>
          <Select value={pos1} onValueChange={setPos1}>
            <SelectTrigger>
              <SelectValue placeholder="Select 1st place" />
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
            2nd Place
          </Label>
          <Select value={pos2} onValueChange={setPos2}>
            <SelectTrigger>
              <SelectValue placeholder="Select 2nd place" />
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
            3rd Place
          </Label>
          <Select value={pos3} onValueChange={setPos3}>
            <SelectTrigger>
              <SelectValue placeholder="Select 3rd place" />
            </SelectTrigger>
            <SelectContent>
              {getAvailable(pos3).map(riderOption)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!pos1 || !pos2 || !pos3 || isPending}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isPending ? "..." : t("confirmResults")}
          </Button>
          {existingResult && (
            <>
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={isPending}
              >
                {t("recalculate")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("deleteResults")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
