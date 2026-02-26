"use server";

import { db } from "@/db";
import { users, invitationCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn, auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(2).max(20),
  invitationCode: z.string().min(1),
});

export async function registerUser(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    nickname: formData.get("nickname") as string,
    invitationCode: formData.get("invitationCode") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "invalidData" };
  }

  const { email, password, nickname, invitationCode } = parsed.data;

  // Check invitation code
  const code = await db.query.invitationCodes.findFirst({
    where: and(
      eq(invitationCodes.code, invitationCode),
      eq(invitationCodes.isActive, true)
    ),
  });

  if (!code || code.currentUses >= code.maxUses) {
    return { error: "invalidInvitationCode" };
  }

  // Check email uniqueness
  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingEmail) {
    return { error: "emailExists" };
  }

  // Check nickname uniqueness
  const existingNickname = await db.query.users.findFirst({
    where: eq(users.nickname, nickname),
  });
  if (existingNickname) {
    return { error: "nicknameExists" };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  const isAdmin = email === "stefano.russello@gmail.com";

  await db.insert(users).values({
    email,
    passwordHash,
    nickname,
    name: nickname,
    role: isAdmin ? "admin" : "user",
  });

  // Increment invitation code usage
  await db
    .update(invitationCodes)
    .set({ currentUses: code.currentUses + 1 })
    .where(eq(invitationCodes.id, code.id));

  return { success: true };
}

export async function validateInvitationCode(code: string) {
  if (!code || code.trim().length === 0) {
    return { error: "invalidInvitationCode" };
  }

  const found = await db.query.invitationCodes.findFirst({
    where: and(
      eq(invitationCodes.code, code.trim()),
      eq(invitationCodes.isActive, true)
    ),
  });

  if (!found || found.currentUses >= found.maxUses) {
    return { error: "invalidInvitationCode" };
  }

  // Save validated code in cookie for the Google OAuth flow
  const cookieStore = await cookies();
  cookieStore.set("invitation_code", code.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return { success: true };
}

export async function consumeInvitationCodeCookie() {
  const cookieStore = await cookies();
  const code = cookieStore.get("invitation_code")?.value;
  if (!code) return null;

  // Delete the cookie
  cookieStore.delete("invitation_code");

  // Find and consume the code
  const found = await db.query.invitationCodes.findFirst({
    where: and(
      eq(invitationCodes.code, code),
      eq(invitationCodes.isActive, true)
    ),
  });

  if (!found || found.currentUses >= found.maxUses) return null;

  await db
    .update(invitationCodes)
    .set({ currentUses: found.currentUses + 1 })
    .where(eq(invitationCodes.id, found.id));

  return code;
}

export async function loginWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "invalidCredentials" };
  }
}

export async function updateNickname(userId: string, nickname: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) {
    return { error: "unauthorized" };
  }

  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { error: "invalidNickname" };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.nickname, trimmed),
  });

  if (existing && existing.id !== userId) {
    return { error: "nicknameExists" };
  }

  await db
    .update(users)
    .set({ nickname: trimmed, name: trimmed })
    .where(eq(users.id, userId));

  revalidatePath("/");
  return { success: true };
}

export async function updateProfileImage(userId: string, imageUrl: string | null) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) {
    return { error: "unauthorized" };
  }

  await db
    .update(users)
    .set({ image: imageUrl })
    .where(eq(users.id, userId));

  revalidatePath("/");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "unauthorized" };
  }

  const isAdmin = session.user.role === "admin";
  const isSelf = session.user.id === userId;

  if (!isAdmin && !isSelf) {
    return { error: "unauthorized" };
  }

  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/");
  return { success: true };
}
