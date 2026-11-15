import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";
import { getStorage } from "@/core/storage/storage.client";
import { storageKeyFor } from "@/modules/document/document.sanitize";
import type { DocumentType } from "@prisma/client";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set([
  "PASSPORT",
  "NATIONAL_ID",
  "PHOTO",
  "MEDICAL_CERTIFICATE",
  "VISA",
  "CONTRACT",
  "OFFER_LETTER",
  "OTHER",
]);

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id: candidateId } = await ctx.params;
    const docs = await withMobileScope(req, async (scope) => {
      const candidate = await db.candidate.findFirst({
        where: { id: candidateId, tenantId: scope.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!candidate) return null;
      return db.document.findMany({
        where: {
          tenantId: scope.tenantId,
          candidateId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          label: true,
          fileName: true,
          mimeType: true,
          confirmed: true,
          createdAt: true,
          expiryDate: true,
        },
      });
    });
    if (docs === null) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json({ documents: docs });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/candidates/documents GET]", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: candidateId } = await ctx.params;
    const result = await withMobileScope(req, async (scope) => {
      const candidate = await db.candidate.findFirst({
        where: { id: candidateId, tenantId: scope.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!candidate) throw new Error("NOT_FOUND");

      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("NO_FILE");
      const buf = Buffer.from(await file.arrayBuffer());
      if (!buf.length) throw new Error("EMPTY");
      if (buf.length > MAX_BYTES) throw new Error("TOO_LARGE");

      const typeRaw = String(form.get("type") ?? "OTHER").toUpperCase();
      const type = (TYPES.has(typeRaw) ? typeRaw : "OTHER") as DocumentType;
      const label =
        String(form.get("label") ?? "").trim() ||
        (type === "OTHER" ? "CV / Other" : type.replace(/_/g, " "));
      const mimeType = file.type || "application/octet-stream";
      const fileName = (file.name || "document").replace(/[^\w.\-]+/g, "_");
      const documentId = randomUUID().replace(/-/g, "").slice(0, 24);
      const storageKey = storageKeyFor({
        tenantId: scope.tenantId,
        documentId,
        fileName,
        candidateId,
      });

      await getStorage().writeObject(storageKey, buf, mimeType);
      const doc = await db.document.create({
        data: {
          id: documentId,
          tenantId: scope.tenantId,
          candidateId,
          type,
          label,
          fileName,
          mimeType,
          sizeBytes: buf.length,
          storageKey,
          storageBucket: "local",
          uploadedBy: scope.userId,
          confirmed: true,
        },
        select: {
          id: true,
          type: true,
          label: true,
          fileName: true,
          createdAt: true,
        },
      });
      return doc;
    });
    return NextResponse.json({ success: true, document: result });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    if (msg === "NO_FILE" || msg === "EMPTY") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (msg === "TOO_LARGE") {
      return NextResponse.json({ error: "File exceeds 10MB" }, { status: 400 });
    }
    console.error("[mobile/candidates/documents POST]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
