"use server";

import { db } from "@/db";
import { predictions, races, riders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const predictionSchema = z.object({
  raceId: z.string().min(1),
  position1RiderId: z.string().min(1),
  position2RiderId: z.string().min(1),
  position3RiderId: z.string().min(1),
});

export async function savePrediction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "unauthorized" };
  }

  const raw = {
    raceId: formData.get("raceId") as string,
    position1RiderId: formData.get("position1RiderId") as string,
    position2RiderId: formData.get("position2RiderId") as string,
    position3RiderId: formData.get("position3RiderId") as string,
  };

  const parsed = predictionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "invalidData" };
  }

  const { raceId, position1RiderId, position2RiderId, position3RiderId } = parsed.data;

  // Can't select same rider twice
  const riderSet = new Set([position1RiderId, position2RiderId, position3RiderId]);
  if (riderSet.size !== 3) {
    return { error: "sameRiderError" };
  }

  // Check race exists and results not confirmed
  const race = await db.query.races.findFirst({
    where: eq(races.id, raceId),
  });

  if (!race) return { error: "raceNotFound" };

  // Check for existing prediction
  const existing = await db.query.predictions.findFirst({
    where: and(
      eq(predictions.userId, session.user.id),
      eq(predictions.raceId, raceId)
    ),
  });

  if (existing) {
    // Block editing if results are already confirmed
    if (race.isResultConfirmed) return { error: "locked" };
    // Update
    await db
      .update(predictions)
      .set({
        position1RiderId,
        position2RiderId,
        position3RiderId,
        updatedAt: new Date(),
      })
      .where(eq(predictions.id, existing.id));
  } else {
    // Insert
    await db.insert(predictions).values({
      userId: session.user.id,
      raceId,
      position1RiderId,
      position2RiderId,
      position3RiderId,
    });
  }

  revalidatePath(`/race/${raceId}`);
  return { success: true, isUpdate: !!existing };
}
