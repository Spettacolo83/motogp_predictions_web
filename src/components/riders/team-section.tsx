import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiderCard } from "./rider-card";
import type { Rider, Team } from "@/db/schema";

export function TeamSection({
  team,
  riders,
  locale,
  factoryLabel,
  satelliteLabel,
}: {
  team: Team;
  riders: Rider[];
  locale: string;
  factoryLabel: string;
  satelliteLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          {team.fullName}
          <Badge variant={team.isFactory ? "default" : "secondary"} className="text-xs">
            {team.isFactory ? factoryLabel : satelliteLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {riders.map((rider) => (
          <RiderCard key={rider.id} rider={rider} team={team} locale={locale} />
        ))}
      </CardContent>
    </Card>
  );
}
