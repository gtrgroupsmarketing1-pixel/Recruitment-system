import type { DocumentType } from "@prisma/client";

export const ALLOWED_MIME: Record<DocumentType, string[]> = {
  PASSPORT: ["image/jpeg", "image/png", "application/pdf"],
  NATIONAL_ID: ["image/jpeg", "image/png", "application/pdf"],
  PHOTO: ["image/jpeg", "image/png"],
  MEDICAL_CERTIFICATE: ["application/pdf", "image/jpeg"],
  VISA: ["image/jpeg", "image/png", "application/pdf"],
  ATTESTATION_PROOF: ["application/pdf", "image/jpeg"],
  LABOR_CLEARANCE: ["application/pdf"],
  TICKET: ["application/pdf", "image/jpeg"],
  BOARDING_PASS: ["application/pdf", "image/jpeg"],
  OFFER_LETTER: ["application/pdf"],
  CONTRACT: ["application/pdf"],
  OTHER: ["application/pdf", "image/jpeg", "image/png"],
};

export function isMimeAllowed(type: DocumentType, mimeType: string): boolean {
  return ALLOWED_MIME[type].includes(mimeType);
}
