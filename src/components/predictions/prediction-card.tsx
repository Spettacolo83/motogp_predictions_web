import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Rider, Team } from "@/db/schema";

interface PodiumEntry {
  rider: Rider & { team: Team };
  points?: number;
}

interface Props {
  title: string;
  avatarUrl?: string | null;
  podium: [PodiumEntry, PodiumEntry, PodiumEntry];
  showPoints?: boolean;
  totalPoints?: number;
}

export function PredictionCard({ title, avatarUrl, podium, showPoints, totalPoints }: Props) {
  const medals = ["bg-yellow-400 text-black", "bg-gray-300 text-black", "bg-amber-700 text-white"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-base">
                {title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {title}
          </div>
          {showPoints && totalPoints !== undefined && (
            <Badge variant="secondary">{totalPoints} pts</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {podium.map((entry, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${medals[i]}`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                #{entry.rider.number} {entry.rider.firstName} {entry.rider.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.rider.team.name}
              </p>
            </div>
            {showPoints && entry.points !== undefined && (
              <Badge variant={entry.points === 2 ? "default" : entry.points === 1 ? "secondary" : "outline"} className="text-xs">
                {entry.points === 2 ? "+2" : entry.points === 1 ? "+1" : "+0"}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
