import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { getStorage } from "@/core/storage/storage.client";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(req: Request) {
  try {
    const result = await withMobileScope(req, async (scope) => {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new Error("NO_FILE");
      }
      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.length === 0) throw new Error("EMPTY_FILE");
      if (buf.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

      const contentType = file.type || "application/pdf";
      const safeName = (file.name || "cv.pdf").replace(/[^\w.\-]+/g, "_");
      const key = `cvs/${scope.tenantId}/${Date.now()}-${safeName}`;

      const storage = getStorage();
      await storage.writeObject(key, buf, contentType);
      const url = await storage.getSignedDownloadUrl(key, 60 * 60 * 24 * 7); // 7d

      return { key, url, contentType, size: buf.length };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "NO_FILE") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (msg === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "File exceeds 12MB" }, { status: 400 });
    }
    console.error("[mobile/upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
