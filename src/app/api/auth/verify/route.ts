import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { sendAdminNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const locale = searchParams.get("locale") || "en";
  const baseUrl = process.env.AUTH_URL || request.url;

  if (!token || !email) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login?error=invalidToken`, baseUrl));
  }

  const verificationToken = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token)
    ),
  });

  if (!verificationToken) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login?error=invalidToken`, baseUrl));
  }

  if (verificationToken.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, token)
        )
      );
    return NextResponse.redirect(new URL(`/${locale}/auth/login?error=tokenExpired`, baseUrl));
  }

  // Verify the user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  // Delete all tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  sendAdminNotification({
    type: "email_verified",
    userName: user?.nickname || user?.name || email,
    details: `Email: ${email}`,
  });

  return NextResponse.redirect(new URL(`/${locale}?verified=true`, baseUrl));
}
