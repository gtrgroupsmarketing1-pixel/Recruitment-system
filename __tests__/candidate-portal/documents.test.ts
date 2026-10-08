import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateDocumentService } from "@/modules/candidate-portal/document.service";

describe("candidate documents", () => {
  it("uploads allowed types for self and soft-deletes them", async () => {
    const seed = await seedTenantWithCase();
    const scope = { kind: "CANDIDATE" as const, tenantId: seed.tenantId, candidateId: seed.candidateId };
    const uploaded = await CandidateDocumentService.requestUpload(scope, {
      type: "PASSPORT",
      fileName: "passport.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 20,
    });
    const row = await authPrisma.document.findFirst({ where: { id: uploaded.documentId } });
    expect(row?.candidateId).toBe(seed.candidateId);
    expect(row?.uploadedBy).toBeNull();
    await expect(
      CandidateDocumentService.requestUpload(scope, {
        type: "TICKET",
        fileName: "ticket.pdf",
        mimeType: "application/pdf",
        sizeBytes: 20,
      })
    ).rejects.toBeInstanceOf(ValidationError);
    await CandidateDocumentService.deleteOwn(scope, uploaded.documentId);
    const gone = await authPrisma.document.findFirst({ where: { id: uploaded.documentId } });
    expect(gone?.deletedAt).toBeTruthy();
  });
});
