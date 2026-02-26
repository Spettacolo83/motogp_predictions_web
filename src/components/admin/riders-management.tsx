"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { addRider, updateRider, deleteRider } from "@/actions/admin";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import type { Rider, Team } from "@/db/schema";

interface Props {
  teams: Team[];
  riders: (Rider & { team: Team })[];
}

function RiderRow({
  rider,
  teams,
  isPending,
  startTransition,
}: {
  rider: Rider & { team: Team };
  teams: Team[];
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const t = useTranslations("admin");
  const [editOpen, setEditOpen] = useState(false);
  const [number, setNumber] = useState(rider.number.toString());
  const [firstName, setFirstName] = useState(rider.firstName);
  const [lastName, setLastName] = useState(rider.lastName);
  const [teamId, setTeamId] = useState(rider.teamId);
  const [nationality, setNationality] = useState(rider.nationality);
  const [isWildcard, setIsWildcard] = useState(rider.isWildcard);
  const [isActive, setIsActive] = useState(rider.isActive);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRider(rider.id, {
        number: parseInt(number),
        firstName,
        lastName,
        teamId,
        nationality,
        isWildcard,
        isActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("riderUpdated"));
        setEditOpen(false);
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "riders");
    fd.append("filename", rider.id);

    const res = await fetch("/api/upload/admin", { method: "POST", body: fd });
    const data = await res.json();

    if (data.url) {
      startTransition(async () => {
        await updateRider(rider.id, { imageUrl: data.url });
        toast.success(t("imageSaved"));
      });
    } else {
      toast.error("Upload failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = () => {
    if (!confirm(t("deleteRiderConfirm"))) return;
    startTransition(async () => {
      await deleteRider(rider.id);
      toast.success(t("riderDeleted"));
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      {rider.imageUrl ? (
        <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: rider.team.color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rider.imageUrl} alt="" className="h-full w-full object-cover object-top" />
        </div>
      ) : (
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: rider.team.color }}
        >
          {rider.number}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          #{rider.number} {rider.firstName} {rider.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {rider.team.name} &middot; {rider.nationality}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {rider.isWildcard && <Badge variant="outline" className="text-xs">WC</Badge>}
        {!rider.isActive && <Badge variant="secondary" className="text-xs">OFF</Badge>}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editRider")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2 py-4">
              {/* Image upload inside dialog */}
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("riderImage")}</Label>
                <div className="flex items-center gap-3">
                  {rider.imageUrl ? (
                    <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: rider.team.color }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rider.imageUrl} alt="" className="h-full w-full object-cover object-top" />
                    </div>
                  ) : (
                    <div
                      className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: rider.team.color }}
                    >
                      {rider.number}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {t("uploadImage")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("riderNumber")}</Label>
                <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("firstName")}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("lastName")}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("nationality")}</Label>
                <Input value={nationality} onChange={(e) => setNationality(e.target.value)} maxLength={2} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("team")}</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="flex items-center gap-2">
                <Checkbox id="wc" checked={isWildcard} onCheckedChange={(v) => setIsWildcard(!!v)} />
                <Label htmlFor="wc">Wildcard</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="active" checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
                <Label htmlFor="active">{t("active")}</Label>
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function RidersManagement({ teams, riders }: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);

  // Controlled state for Add Rider form (avoids Select name prop issues)
  const [addNumber, setAddNumber] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addNationality, setAddNationality] = useState("");
  const [addTeamId, setAddTeamId] = useState("");
  const [addIsWildcard, setAddIsWildcard] = useState(false);

  const resetAddForm = () => {
    setAddNumber("");
    setAddFirstName("");
    setAddLastName("");
    setAddNationality("");
    setAddTeamId("");
    setAddIsWildcard(false);
  };

  const handleAdd = () => {
    const fd = new FormData();
    fd.set("number", addNumber);
    fd.set("firstName", addFirstName);
    fd.set("lastName", addLastName);
    fd.set("nationality", addNationality);
    fd.set("teamId", addTeamId);
    fd.set("isWildcard", addIsWildcard ? "true" : "false");

    startTransition(async () => {
      const result = await addRider(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("riderAdded"));
        resetAddForm();
        setAddOpen(false);
      }
    });
  };

  const regularRiders = riders.filter((r) => !r.isWildcard);
  const wildcardRiders = riders.filter((r) => r.isWildcard);

  return (
    <div className="space-y-6">
      {/* Add rider button */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
        <DialogTrigger asChild>
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            {t("addRider")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addRider")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 py-4">
            <div className="space-y-2">
              <Label>{t("riderNumber")}</Label>
              <Input type="number" value={addNumber} onChange={(e) => setAddNumber(e.target.value)} min={1} />
            </div>
            <div className="space-y-2">
              <Label>{t("firstName")}</Label>
              <Input value={addFirstName} onChange={(e) => setAddFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("lastName")}</Label>
              <Input value={addLastName} onChange={(e) => setAddLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("nationality")}</Label>
              <Input value={addNationality} onChange={(e) => setAddNationality(e.target.value)} placeholder="IT, ES, FR..." maxLength={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("team")}</Label>
              <Select value={addTeamId} onValueChange={setAddTeamId}>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="addWc"
                checked={addIsWildcard}
                onCheckedChange={(v) => setAddIsWildcard(!!v)}
              />
              <Label htmlFor="addWc">Wildcard</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
            <Button
              onClick={handleAdd}
              disabled={isPending || !addNumber || !addFirstName || !addLastName || !addTeamId || !addNationality}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "..." : t("addRider")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regular riders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("regularRiders")} ({regularRiders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {regularRiders.map((rider) => (
            <RiderRow
              key={rider.id}
              rider={rider}
              teams={teams}
              isPending={isPending}
              startTransition={startTransition}
            />
          ))}
        </CardContent>
      </Card>

      {/* Wildcard riders */}
      {wildcardRiders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Wildcard ({wildcardRiders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {wildcardRiders.map((rider) => (
              <RiderRow
                key={rider.id}
                rider={rider}
                teams={teams}
                isPending={isPending}
                startTransition={startTransition}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
