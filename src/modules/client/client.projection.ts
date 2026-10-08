import type { ApplicationStatus } from "@prisma/client";

export type ClientDocumentView = {
  id: string;
  label: string;
  fileName: string;
};

export type ClientCandidateView = {
  applicationId: string;
  candidateId: string;
  displayName: string;
  roleCategory: string;
  currentStatus: ApplicationStatus;
  screeningScore: number | null;
  interviewNotes: string | null;
  documents: ClientDocumentView[];
};

export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Candidate";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Strict client projection. Callers must not pass passport, phone, email,
 * nationalId, or medicalResult — this function does not accept them.
 */
export function projectClientCandidate(input: {
  applicationId: string;
  candidateId: string;
  fullName: string;
  roleCategory: string;
  currentStatus: ApplicationStatus;
  screeningScore?: number | null;
  interviewNotes?: string | null;
  documents?: { id: string; label: string; fileName: string; clientVisible: boolean }[];
}): ClientCandidateView {
  return {
    applicationId: input.applicationId,
    candidateId: input.candidateId,
    displayName: displayName(input.fullName),
    roleCategory: input.roleCategory,
    currentStatus: input.currentStatus,
    screeningScore: input.screeningScore ?? null,
    interviewNotes: input.interviewNotes ?? null,
    documents: (input.documents ?? [])
      .filter((d) => d.clientVisible)
      .map((d) => ({ id: d.id, label: d.label, fileName: d.fileName })),
  };
}
