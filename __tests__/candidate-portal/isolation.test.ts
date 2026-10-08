import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { NotFoundError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateProfileService } from "@/modules/candidate-portal/profile.service";
import { CandidateDocumentService } from "@/modules/candidate-portal/document.service";
import { CandidateStatusService } from "@/modules/candidate-portal/status.service";

describe("candidate portal isolation", () => {
  it("keeps candidate A off candidate B", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const b = await authPrisma.candidate.create({
      data: { id: `c-b-${stamp}`, tenantId: seed.tenantId, fullName: "Other", email: `b-${stamp}@seed.local` },
    });
    const scopeA = { kind: "CANDIDATE" as const, tenantId: seed.tenantId, candidateId: seed.candidateId };
    const self = await CandidateProfileService.getSelf(scopeA);
    expect(self.id).toBe(seed.candidateId);
    expect(self.fullName).not.toBe("Other");
    const docs = await CandidateDocumentService.list(scopeA);
    expect(docs.find((doc) => doc.candidateId === b.id)).toBeUndefined();
    await expect(CandidateStatusService.getTimeline(scopeA, "missing")).rejects.toBeInstanceOf(NotFoundError);
    const uploaded = await CandidateDocumentService.requestUpload(scopeA, {
      type: "PASSPORT",
      fileName: "p.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 10,
    });
    const row = await authPrisma.document.findFirst({ where: { id: uploaded.documentId } });
    expect(row?.candidateId).toBe(seed.candidateId);
    expect(row?.candidateId).not.toBe(b.id);
  });
});
