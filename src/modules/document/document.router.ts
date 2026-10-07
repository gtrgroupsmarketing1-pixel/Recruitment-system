import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { DocumentService } from "./document.service";

const typeSchema = z.enum([
  "PASSPORT",
  "NATIONAL_ID",
  "PHOTO",
  "MEDICAL_CERTIFICATE",
  "VISA",
  "ATTESTATION_PROOF",
  "LABOR_CLEARANCE",
  "TICKET",
  "BOARDING_PASS",
  "OFFER_LETTER",
  "CONTRACT",
  "OTHER",
]);

export const documentRouter = router({
  requestUpload: protectedProcedure
    .input(z.object({
      type: typeSchema,
      candidateId: z.string().optional(),
      checklistId: z.string().optional(),
      label: z.string().min(1),
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().positive(),
    }))
    .mutation(({ ctx, input }) =>
      DocumentService.requestUpload(ctx.tenantId, ctx.userId, input)
    ),
  confirmUpload: protectedProcedure
    .input(z.object({ documentId: z.string(), checksumSha256: z.string().min(8) }))
    .mutation(({ ctx, input }) =>
      DocumentService.confirmUpload(ctx.tenantId, ctx.userId, input.documentId, input.checksumSha256)
    ),
  listForCandidate: protectedProcedure
    .input(z.object({ candidateId: z.string() }))
    .query(({ ctx, input }) => DocumentService.listForCandidate(ctx.tenantId, input.candidateId)),
  getDownloadUrl: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(({ ctx, input }) => DocumentService.getDownloadUrl(ctx.tenantId, ctx.userId, input.documentId)),
  delete: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(({ ctx, input }) => DocumentService.softDelete(ctx.tenantId, ctx.userId, input.documentId)),
});
