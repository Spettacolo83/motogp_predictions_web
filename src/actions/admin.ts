"use server";

import { db } from "@/db";
import { predictions, riders, races, scores, raceResults, users, accounts, verificationTokens } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateScore } from "@/lib/scoring";
import { sendVerificationEmail } from "@/lib/email";

export async function deletePrediction(predictionId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db.delete(predictions).where(eq(predictions.id, predictionId));
  revalidatePath("/");
  return { success: true };
}

export async function adminEditPrediction(
  predictionId: string,
  position1RiderId: string,
  position2RiderId: string,
  position3RiderId: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const riderSet = new Set([position1RiderId, position2RiderId, position3RiderId]);
  if (riderSet.size !== 3) {
    return { error: "sameRider" };
  }

  // Get prediction to find raceId
  const pred = await db.query.predictions.findFirst({
    where: eq(predictions.id, predictionId),
  });
  if (!pred) return { error: "notFound" };

  await db
    .update(predictions)
    .set({
      position1RiderId,
      position2RiderId,
      position3RiderId,
      updatedAt: new Date(),
    })
    .where(eq(predictions.id, predictionId));

  // If results are confirmed, recalculate this user's score
  const result = await db.query.raceResults.findFirst({
    where: eq(raceResults.raceId, pred.raceId),
  });

  if (result) {
    const score = calculateScore(
      { pos1: position1RiderId, pos2: position2RiderId, pos3: position3RiderId },
      { pos1: result.position1RiderId, pos2: result.position2RiderId, pos3: result.position3RiderId }
    );

    // Delete old score and insert new one
    const existingScores = await db.query.scores.findMany({
      where: eq(scores.raceId, pred.raceId),
    });
    const userScore = existingScores.find((s) => s.userId === pred.userId);

    if (userScore) {
      await db
        .update(scores)
        .set({
          points: score.total,
          position1Points: score.pos1,
          position2Points: score.pos2,
          position3Points: score.pos3,
          calculatedAt: new Date(),
        })
        .where(eq(scores.id, userScore.id));
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function unlockRaceForPredictions(raceId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(races)
    .set({ isResultConfirmed: false })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}

export async function updateRaceDate(raceId: string, date: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(races)
    .set({ date })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}

export async function updateRaceInfo(
  raceId: string,
  data: {
    status: "scheduled" | "postponed" | "cancelled" | "rescheduled";
    date: string;
    newDate?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(races)
    .set({
      status: data.status,
      date: data.date,
      newDate: data.newDate || null,
    })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}

export async function addWildcardRider(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const number = parseInt(formData.get("number") as string);
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const teamId = formData.get("teamId") as string;
  const nationality = formData.get("nationality") as string;

  if (!firstName || !lastName || !teamId || !nationality || isNaN(number)) {
    return { error: "invalidData" };
  }

  await db.insert(riders).values({
    number,
    firstName,
    lastName,
    teamId,
    nationality,
    isWildcard: true,
    isActive: true,
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteRider(riderId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db.delete(riders).where(eq(riders.id, riderId));
  revalidatePath("/");
  return { success: true };
}

export async function updateRaceTrackImage(raceId: string, trackImage: string | null) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(races)
    .set({ trackImage })
    .where(eq(races.id, raceId));

  revalidatePath("/");
  return { success: true };
}

export async function updateRider(
  riderId: string,
  data: {
    number?: number;
    firstName?: string;
    lastName?: string;
    teamId?: string;
    nationality?: string;
    imageUrl?: string | null;
    isWildcard?: boolean;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  await db
    .update(riders)
    .set(data)
    .where(eq(riders.id, riderId));

  revalidatePath("/");
  return { success: true };
}

export async function addRider(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const number = parseInt(formData.get("number") as string);
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const teamId = formData.get("teamId") as string;
  const nationality = formData.get("nationality") as string;
  const isWildcard = formData.get("isWildcard") === "true";

  if (!firstName || !lastName || !teamId || !nationality || isNaN(number)) {
    return { error: "invalidData" };
  }

  const id = firstName.toLowerCase().replace(/\s+/g, "-") + "-" + lastName.toLowerCase().replace(/\s+/g, "-");

  await db.insert(riders).values({
    id,
    number,
    firstName,
    lastName,
    teamId,
    nationality,
    isWildcard,
    isActive: true,
  });

  revalidatePath("/");
  return { success: true };
}

export async function adminUpdateUser(
  userId: string,
  data: { nickname?: string; role?: "user" | "admin" }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  // Cannot change own role
  if (data.role && userId === session.user.id) {
    return { error: "cannotChangeSelfRole" };
  }

  // Check nickname uniqueness if changing
  if (data.nickname) {
    const existing = await db.query.users.findFirst({
      where: and(eq(users.nickname, data.nickname), ne(users.id, userId)),
    });
    if (existing) {
      return { error: "nicknameExists" };
    }
  }

  await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId));

  revalidatePath("/");
  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  // Cannot delete self
  if (userId === session.user.id) {
    return { error: "cannotDeleteSelf" };
  }

  // CASCADE handles predictions, scores, accounts
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/");
  return { success: true };
}

export async function adminVerifyUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return { error: "userNotFound" };

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId));

  // Clean up pending tokens
  if (user.email) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, user.email));
  }

  revalidatePath("/");
  return { success: true };
}

export async function adminResendVerification(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "unauthorized" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user?.email) return { error: "userNotFound" };
  if (user.emailVerified) return { error: "alreadyVerified" };

  // Delete old tokens
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, user.email));

  // Generate new token
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: user.email,
    token,
    expires,
  });

  const sent = await sendVerificationEmail({
    email: user.email,
    token,
    locale: "en",
  });

  if (!sent) return { error: "emailFailed" };

  return { success: true };
}
