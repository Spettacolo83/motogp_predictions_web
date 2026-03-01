import type { Rider, Team } from "@/db/schema";

interface Props {
  riders: (Rider & { team: Team })[];
  pos1: string;
  pos2: string;
  pos3: string;
}

function PodiumSlot({
  rider,
  position,
}: {
  rider?: Rider & { team: Team };
  position: 1 | 2 | 3;
}) {
  const heights = { 1: "h-20", 2: "h-14", 3: "h-10" };
  const colors = {
    1: "bg-yellow-400",
    2: "bg-gray-300",
    3: "bg-amber-700",
  };
  const textColors = { 1: "text-black", 2: "text-black", 3: "text-white" };

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {/* Rider image */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-background shadow-md">
        {rider?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rider.imageUrl}
            alt={`${rider.firstName} ${rider.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : rider ? (
          <span className="text-lg font-bold text-muted-foreground">
            {rider.firstName.charAt(0)}
            {rider.lastName.charAt(0)}
          </span>
        ) : (
          <span className="text-lg text-muted-foreground/40">?</span>
        )}
      </div>

      {/* Rider name */}
      <div className="text-center min-h-[2.5rem]">
        {rider ? (
          <>
            <p className="text-xs font-bold leading-tight">
              #{rider.number} {rider.lastName}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[90px]">
              {rider.team.name}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </div>

      {/* Podium base */}
      <div
        className={`${heights[position]} ${colors[position]} ${textColors[position]} w-full rounded-t-md flex items-center justify-center font-bold text-lg`}
      >
        {position}
      </div>
    </div>
  );
}

export function PodiumPreview({ riders, pos1, pos2, pos3 }: Props) {
  const riderMap = new Map(riders.map((r) => [r.id, r]));

  const hasAny = pos1 || pos2 || pos3;
  if (!hasAny) return null;

  return (
    <div className="flex items-end justify-center gap-1 px-2 py-3">
      {/* 2nd place - left */}
      <PodiumSlot rider={pos2 ? riderMap.get(pos2) : undefined} position={2} />
      {/* 1st place - center (tallest) */}
      <PodiumSlot rider={pos1 ? riderMap.get(pos1) : undefined} position={1} />
      {/* 3rd place - right */}
      <PodiumSlot rider={pos3 ? riderMap.get(pos3) : undefined} position={3} />
    </div>
  );
}
