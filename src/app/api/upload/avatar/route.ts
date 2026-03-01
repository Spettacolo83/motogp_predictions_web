import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  // Admin can upload avatar for another user
  const targetUserId = formData.get("userId") as string | null;
  const userId = targetUserId && session.user.role === "admin"
    ? targetUserId
    : session.user.id;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too large" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${userId}-${Date.now()}.${ext}`;

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const uploadDir = path.join(dataDir, "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const imageUrl = process.env.DATA_DIR
    ? `/api/files/uploads/avatars/${filename}`
    : `/uploads/avatars/${filename}`;

  await db
    .update(users)
    .set({ image: imageUrl })
    .where(eq(users.id, userId));

  return NextResponse.json({ url: imageUrl });
}
