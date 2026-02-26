import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Rider, Team } from "@/db/schema";

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

export function RiderCard({
  rider,
  team,
  locale,
}: {
  rider: Rider;
  team: Team;
  locale: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
      <div className="relative flex-shrink-0">
        {rider.imageUrl ? (
          <div
            className="h-[88px] w-[88px] rounded-xl overflow-hidden"
            style={{ backgroundColor: team.color }}
          >
            <Image
              src={rider.imageUrl}
              alt={`${rider.firstName} ${rider.lastName}`}
              width={200}
              height={200}
              className="h-full w-full object-cover object-top"
            />
          </div>
        ) : (
          <div
            className="flex h-[88px] w-[88px] items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: team.color }}
          >
            {rider.number}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base truncate">
          {rider.firstName} {rider.lastName}
        </p>
        <p className="text-sm text-muted-foreground">
          #{rider.number}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {countryFlag(rider.nationality)} {team.name}
        </p>
      </div>
      {rider.isWildcard && (
        <Badge variant="outline" className="text-xs">
          WC
        </Badge>
      )}
    </div>
  );
}
