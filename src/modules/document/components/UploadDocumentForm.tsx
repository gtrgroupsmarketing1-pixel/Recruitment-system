"use client";

import { useActionState } from "react";
import {
  uploadCandidateDocumentAction,
  type UploadDocState,
} from "@/modules/document/upload.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DOC_TYPES = [
  { value: "PASSPORT", label: "Passport" },
  { value: "NATIONAL_ID", label: "National ID / License" },
  { value: "PHOTO", label: "Photo" },
  { value: "MEDICAL_CERTIFICATE", label: "Medical certificate" },
  { value: "VISA", label: "Visa" },
  { value: "CONTRACT", label: "Contract" },
  { value: "OFFER_LETTER", label: "Offer letter" },
  { value: "OTHER", label: "CV / Other" },
] as const;

type Props = {
  candidateId: string;
  candidateName?: string;
};

export function UploadDocumentForm({ candidateId, candidateName }: Props) {
  const [state, action, pending] = useActionState(
    uploadCandidateDocumentAction,
    {} as UploadDocState
  );

  return (
    <form action={action} className="space-y-3 rounded-lg border p-4">
      <input type="hidden" name="candidateId" value={candidateId} />
      <div>
        <p className="text-sm font-medium">
          Upload document
          {candidateName ? (
            <span className="text-muted-foreground"> · {candidateName}</span>
          ) : null}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="type">Document type</Label>
          <select
            id="type"
            name="type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            defaultValue="PASSPORT"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="label">Label (optional)</Label>
          <Input id="label" name="label" placeholder="e.g. Passport bio page" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" required accept=".pdf,image/*" />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">Document uploaded.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
