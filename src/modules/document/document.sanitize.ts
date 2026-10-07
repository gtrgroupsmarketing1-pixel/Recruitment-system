export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export function storageKeyFor(input: {
  tenantId: string;
  documentId: string;
  fileName: string;
  candidateId?: string | null;
  checklistId?: string | null;
}): string {
  const file = sanitizeFilename(input.fileName);
  if (input.candidateId) {
    return `tenants/${input.tenantId}/candidates/${input.candidateId}/${input.documentId}/${file}`;
  }
  return `tenants/${input.tenantId}/checklists/${input.checklistId}/${input.documentId}/${file}`;
}
