import type { DocumentType } from "@prisma/client";

export const REQUIRED_DOC_TO_TYPE: Record<string, DocumentType> = {
  passport_copy: "PASSPORT",
  passport_original: "PASSPORT",
  photo: "PHOTO",
  medical_certificate: "MEDICAL_CERTIFICATE",
  visa_copy: "VISA",
  attestation_proof: "ATTESTATION_PROOF",
  ecr_clearance: "LABOR_CLEARANCE",
  labor_contract: "CONTRACT",
  ticket_copy: "TICKET",
  boarding_pass: "BOARDING_PASS",
};

export function mapRequiredDoc(name: string): DocumentType | undefined {
  return REQUIRED_DOC_TO_TYPE[name];
}
