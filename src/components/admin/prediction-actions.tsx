"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deletePrediction, adminEditPrediction, unlockRaceForPredictions } from "@/actions/admin";
import { toast } from "sonner";
import { Trash2, Pencil, Unlock } from "lucide-react";
import type { Rider, Team } from "@/db/schema";

interface Props {
  predictionId: string;
  raceId: string;
  currentPos1: string;
  currentPos2: string;
  currentPos3: string;
  riders: (Rider & { team: Team })[];
  isResultConfirmed: boolean;
}

export function PredictionActions({
  predictionId,
  raceId,
  currentPos1,
  currentPos2,
  currentPos3,
  riders,
  isResultConfirmed,
}: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pos1, setPos1] = useState(currentPos1);
  const [pos2, setPos2] = useState(currentPos2);
  const [pos3, setPos3] = useState(currentPos3);

  const selected = [pos1, pos2, pos3].filter(Boolean);
  const getAvailable = (current: string) =>
    riders.filter((r) => r.isActive && (!selected.includes(r.id) || r.id === current));

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePrediction(predictionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("predictionDeleted"));
        setDeleteOpen(false);
      }
    });
  };

  const handleEdit = () => {
    if (!pos1 || !pos2 || !pos3) return;
    startTransition(async () => {
      const result = await adminEditPrediction(predictionId, pos1, pos2, pos3);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("predictionUpdated"));
        setEditOpen(false);
      }
    });
  };

  const handleUnlock = () => {
    startTransition(async () => {
      const result = await unlockRaceForPredictions(raceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("raceUnlocked"));
      }
    });
  };

  const riderOption = (rider: Rider & { team: Team }) => (
    <SelectItem key={rider.id} value={rider.id}>
      #{rider.number} {rider.firstName} {rider.lastName} ({rider.team.name})
    </SelectItem>
  );

  return (
    <div className="flex items-center gap-1">
      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editPrediction")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">1st</label>
              <Select value={pos1} onValueChange={setPos1}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{getAvailable(pos1).map(riderOption)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">2nd</label>
              <Select value={pos2} onValueChange={setPos2}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{getAvailable(pos2).map(riderOption)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">3rd</label>
              <Select value={pos3} onValueChange={setPos3}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{getAvailable(pos3).map(riderOption)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleEdit} disabled={isPending} className="w-full bg-red-600 hover:bg-red-700">
              {isPending ? "..." : t("confirmResults")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deletePrediction")}</DialogTitle>
            <DialogDescription>{t("deletePredictionConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "..." : t("deletePrediction")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlock */}
      {isResultConfirmed && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUnlock} disabled={isPending}>
          <Unlock className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
