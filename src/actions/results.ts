"use server";

import { db } from "@/db";
import { raceResults, races, predictions, scores } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateScore } from "@/lib/scoring";
import { z } from "zod";

const resultSchema = z.object({
  raceId: z.string().min(1),
  position1RiderId: z.string().min(1),
  position2RiderId: z.string().min(1),
  position3RiderId: z.string().min(1),
});

export async function saveResults(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const raw = {
    raceId: formData.get("raceId") as string,
    position1RiderId: formData.get("position1RiderId") as string,
    position2RiderId: formData.get("position2RiderId") as string,
    position3RiderId: formData.get("position3RiderId") as string,
  };

  const parsed = resultSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "invalidData" };
  }

  const { raceId, position1RiderId, position2RiderId, position3RiderId } = parsed.data;

  // Upsert race results
  const existing = await db.query.raceResults.findFirst({
    where: eq(raceResults.raceId, raceId),
  });

  if (existing) {
    await db
      .update(raceResults)
      .set({
        position1RiderId,
        position2RiderId,
        position3RiderId,
        confirmedAt: new Date(),
        confirmedBy: session.user.id,
      })
      .where(eq(raceResults.id, existing.id));
  } else {
    await db.insert(raceResults).values({
      raceId,
      position1RiderId,
      position2RiderId,
      position3RiderId,
      confirmedBy: session.user.id,
    });
  }

  // Mark race as confirmed
  await db
    .update(races)
    .set({ isResultConfirmed: true })
    .where(eq(races.id, raceId));

  // Calculate scores for all predictions
  await calculateAllScores(raceId, position1RiderId, position2RiderId, position3RiderId);

  revalidatePath("/");
  return { success: true };
}

async function calculateAllScores(
  raceId: string,
  res1: string,
  res2: string,
  res3: string
) {
  // Delete existing scores for this race
  await db.delete(scores).where(eq(scores.raceId, raceId));

  // Get all predictions for this race
  const racePredictions = await db.query.predictions.findMany({
    where: eq(predictions.raceId, raceId),
  });

  const result = { pos1: res1, pos2: res2, pos3: res3 };

  for (const pred of racePredictions) {
    const prediction = {
      pos1: pred.position1RiderId,
      pos2: pred.position2RiderId,
      pos3: pred.position3RiderId,
    };

    const score = calculateScore(prediction, result);

    await db.insert(scores).values({
      userId: pred.userId,
      raceId,
      points: score.total,
      position1Points: score.pos1,
      position2Points: score.pos2,
      position3Points: score.pos3,
    });
  }
}

export async function recalculateScores(raceId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const result = await db.query.raceResults.findFirst({
    where: eq(raceResults.raceId, raceId),
  });

  if (!result) return { error: "noResults" };

  await calculateAllScores(
    raceId,
    result.position1RiderId,
    result.position2RiderId,
    result.position3RiderId
  );

  revalidatePath("/");
  return { success: true };
}

export async function deleteRaceResults(raceId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  // Delete scores for this race
  await db.delete(scores).where(eq(scores.raceId, raceId));

  // Delete race results
  await db.delete(raceResults).where(eq(raceResults.raceId, raceId));

  // Mark race as not confirmed
  await db
    .update(races)
    .set({ isResultConfirmed: false })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}

export async function updateRaceStatus(
  raceId: string,
  status: "scheduled" | "postponed" | "cancelled" | "rescheduled",
  newDate?: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(races)
    .set({ status, newDate: newDate || null })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}
