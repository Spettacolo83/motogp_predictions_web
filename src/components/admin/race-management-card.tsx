"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRaceInfo, updateRaceTrackImage } from "@/actions/admin";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import type { Race } from "@/db/schema";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export function RaceManagementCard({ race, locale }: { race: Race; locale: string }) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(race.status);
  const [date, setDate] = useState(race.date);
  const [newDate, setNewDate] = useState(race.newDate || "");
  const [trackImage, setTrackImage] = useState(race.trackImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRaceInfo(race.id, {
        status: status as Race["status"],
        date,
        newDate: status === "rescheduled" ? newDate : null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("raceUpdated"));
      }
    });
  };

  const handleTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "tracks");
    fd.append("filename", race.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));

    const res = await fetch("/api/upload/admin", { method: "POST", body: fd });
    const data = await res.json();

    if (data.url) {
      startTransition(async () => {
        await updateRaceTrackImage(race.id, data.url);
        setTrackImage(data.url);
        toast.success(t("trackUpdated"));
      });
    } else {
      toast.error(data.error || "Upload failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveTrack = () => {
    startTransition(async () => {
      await updateRaceTrackImage(race.id, null);
      setTrackImage(null);
      toast.success(t("trackRemoved"));
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        <span className="text-lg">{countryFlag(race.countryCode)}</span>
        <p className="font-medium text-sm flex-1">
          R{race.round} - {locale === "it" ? race.nameIt : race.name}
        </p>
        {trackImage && (
          <div className="w-28 h-28 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trackImage}
              alt="Track"
              className="w-full h-full object-contain"
              style={{ filter: "brightness(0)", opacity: 0.3 }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("changeStatus")}</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Race["status"])}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">{t("statusScheduled")}</SelectItem>
              <SelectItem value="postponed">{t("statusPostponed")}</SelectItem>
              <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
              <SelectItem value="rescheduled">{t("statusRescheduled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("raceDate")}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[150px] h-9"
          />
        </div>
        {status === "rescheduled" && (
          <div className="space-y-1">
            <Label className="text-xs">{t("newDate")}</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-[150px] h-9"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">{t("trackImage")}</Label>
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleTrackUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="h-3 w-3 mr-1" />
              {trackImage ? t("changeTrack") : t("uploadTrack")}
            </Button>
            {trackImage && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={handleRemoveTrack}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 h-9"
        >
          {isPending ? "..." : t("save")}
        </Button>
      </div>
    </div>
  );
}
