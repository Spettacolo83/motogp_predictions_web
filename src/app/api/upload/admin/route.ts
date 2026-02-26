import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null; // "tracks" or "riders"
  const filename = formData.get("filename") as string | null;

  if (!file || !folder || !filename) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (!["tracks", "riders"].includes(folder)) {
    return NextResponse.json({ error: "invalid folder" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too large" }, { status: 400 });
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const safeName = filename.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const fullFilename = `${safeName}.${ext}`;

  const dataDir = process.env.DATA_DIR;
  const uploadDir = dataDir
    ? path.join(dataDir, "uploads", folder)
    : path.join(process.cwd(), "public", folder);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fullFilename), buffer);

  const url = dataDir
    ? `/api/files/uploads/${folder}/${fullFilename}`
    : `/${folder}/${fullFilename}`;
  return NextResponse.json({ url });
}
