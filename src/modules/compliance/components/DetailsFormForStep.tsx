"use client";

import { saveDetailsAction } from "@/modules/compliance/details.action";

type Props = {
  caseId: string;
  checklistId: string;
  connectorId: string | null;
};

export function DetailsFormForStep({ caseId, checklistId, connectorId }: Props) {
  if (!connectorId) return null;
  return (
    <form action={saveDetailsAction} className="mt-2 grid gap-1 text-xs">
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="checklistId" value={checklistId} />
      <input type="hidden" name="connectorId" value={connectorId} />
      {connectorId === "wafid" ? (
        <>
          <input name="centerName" placeholder="Medical center" className="rounded border px-2 py-1" />
          <input name="result" placeholder="FIT / UNFIT" className="rounded border px-2 py-1" />
        </>
      ) : null}
      {connectorId === "mohre" ? (
        <input name="visaNumber" placeholder="Visa number" className="rounded border px-2 py-1" />
      ) : null}
      {connectorId === "dmw" ? (
        <input name="clearanceType" placeholder="ECR" className="rounded border px-2 py-1" />
      ) : null}
      {connectorId === "travel" ? (
        <input name="flightNumber" placeholder="Flight" className="rounded border px-2 py-1" />
      ) : null}
      {connectorId === "deployment" ? (
        <input name="site" placeholder="Site" className="rounded border px-2 py-1" />
      ) : null}
      {connectorId === "attestation" ? (
        <p className="text-neutral-500">Attestation chain created on save.</p>
      ) : null}
      <button type="submit" className="w-fit rounded border px-2 py-1">
        Save details
      </button>
    </form>
  );
}
