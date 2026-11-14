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
      // 👇 1. Parse the JSON body instead of FormData
      const body = await req.json();
      const { base64File, fileName, mimeType } = body;

      if (!base64File) {
        throw new Error("NO_FILE");
      }

      // 👇 2. Convert the Base64 string back to a Buffer
      const buf = Buffer.from(base64File, "base64");

      if (buf.length === 0) throw new Error("EMPTY_FILE");
      if (buf.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

      const contentType = mimeType || "application/pdf";
      const safeName = (fileName || "cv.pdf").replace(/[^\w.\-]+/g, "_");
      const key = `cvs/${scope.tenantId}/${Date.now()}-${safeName}`;

      // 👇 3. Upload to your storage provider
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
    if (msg === "EMPTY_FILE") {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (msg === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "File exceeds 12MB" }, { status: 400 });
    }
    
    console.error("[mobile/upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}