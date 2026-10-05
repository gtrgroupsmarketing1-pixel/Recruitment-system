/**
 * Source of truth for encrypted fields.
 * Adding a field here is the only way to enable encryption on it.
 * Nested writes are NOT handled by the middleware (Session 04 deferral).
 */
export const SENSITIVE_FIELDS = {
  Candidate: {
    passportNumber: { bidx: "passportNumberBidx" },
    nationalId: { bidx: "nationalIdBidx" },
    medicalResult: { bidx: "medicalResultBidx" },
  },
  WorkPermitVisa: {
    visaNumber: { bidx: "visaNumberBidx" },
  },
} as const;

export type SensitiveModel = keyof typeof SENSITIVE_FIELDS;
