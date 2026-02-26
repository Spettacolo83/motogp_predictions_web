"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Race } from "@/db/schema";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export function RaceCard({
  race,
  isNext,
  isCompleted,
}: {
  race: Race;
  isNext: boolean;
  isCompleted: boolean;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();

  const dateStr = new Date(race.date).toLocaleDateString(
    locale === "it" ? "it-IT" : "en-US",
    { day: "numeric", month: "short" }
  );

  const statusBadge = () => {
    if (race.status === "cancelled") {
      return <Badge variant="destructive">{t("cancelled")}</Badge>;
    }
    if (race.status === "postponed") {
      return <Badge variant="secondary">{t("postponed")}</Badge>;
    }
    if (race.status === "rescheduled" && race.newDate) {
      return (
        <Badge variant="secondary">
          {t("rescheduled", {
            date: new Date(race.newDate).toLocaleDateString(
              locale === "it" ? "it-IT" : "en-US",
              { day: "numeric", month: "short" }
            ),
          })}
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600">
          {t("completed")}
        </Badge>
      );
    }
    if (isNext) {
      return (
        <Badge className="bg-red-600">{t("nextRace")}</Badge>
      );
    }
    return null;
  };

  return (
    <Link href={`/${locale}/race/${race.id}`}>
      <Card
        className={`transition-all hover:shadow-md cursor-pointer ${
          isNext ? "border-red-400 ring-2 ring-red-100" : ""
        } ${race.status === "cancelled" ? "opacity-50" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("round")} {race.round}
            </span>
            {statusBadge()}
          </div>
          <div className="flex items-start gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{countryFlag(race.countryCode)}</span>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">
                    {locale === "it" ? race.nameIt : race.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {locale === "it" ? race.circuitIt : race.circuit}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">{dateStr}</p>
            </div>
            {race.trackImage && (
              <div className="w-24 h-24 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={race.trackImage}
                  alt="Track"
                  className="w-full h-full object-contain"
                  style={{ filter: "brightness(0)", opacity: 0.2 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
