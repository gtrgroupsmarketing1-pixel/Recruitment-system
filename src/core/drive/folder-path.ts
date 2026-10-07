export function sanitizeSegment(name: string): string {
  return name.replace(/[\\/\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function folderPath(input: {
  candidateName: string;
  candidateId: string;
  stepOrder?: number | null;
  stepName?: string | null;
}): string[] {
  const who = `${sanitizeSegment(input.candidateName) || "Candidate"} (${sanitizeSegment(input.candidateId)})`;
  const parts = ["Candidates", who];
  if (input.stepOrder != null && input.stepName) {
    parts.push(`${input.stepOrder}-${sanitizeSegment(input.stepName)}`);
  }
  return parts;
}

export function nextAttemptAt(attempts: number, now = Date.now()): Date | null {
  if (attempts <= 0) return new Date(now);
  if (attempts === 1) return new Date(now + 5 * 60_000);
  if (attempts === 2) return new Date(now + 30 * 60_000);
  if (attempts === 3) return new Date(now + 2 * 60 * 60_000);
  if (attempts === 4) return new Date(now + 12 * 60 * 60_000);
  return null;
}
