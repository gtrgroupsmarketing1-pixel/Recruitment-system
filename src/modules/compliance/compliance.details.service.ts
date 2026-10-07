import { db } from "@/core/db/client";
import { NotFoundError } from "@/lib/errors";
import { assertAttestationOrder } from "./compliance.attestation";

const AUTHORITIES = ["NOTARY", "STATE_HRD", "MEA", "EMBASSY", "MOFA"] as const;

export type ChecklistDetails =
  | { kind: "MEDICAL"; medical: { id: string; centerName: string | null; result: string | null } }
  | { kind: "ATTESTATION"; chain: { id: string; steps: Array<{ id: string; stepOrder: number | null; authority: string | null; status: string }> } }
  | { kind: "LABOR_EXIT"; laborExit: { id: string; clearanceType: string | null } }
  | { kind: "VISA"; visa: { id: string; visaNumber: string | null; visaType: string | null } }
  | { kind: "TRAVEL"; travel: { id: string; flightNumber: string | null } }
  | { kind: "DEPLOYMENT"; deployment: { id: string; site: string | null } }
  | { kind: "NONE" };

async function requireChecklist(tenantId: string, checklistId: string) {
  const row = await db.checklistInstance.findFirst({
    where: { id: checklistId, tenantId, deletedAt: null },
    include: { case: true, stepTemplate: true },
  });
  if (!row) throw new NotFoundError("ChecklistInstance", checklistId);
  return row;
}

export const ComplianceDetailsService = {
  async saveMedicalDetails(
    tenantId: string,
    _userId: string,
    checklistId: string,
    input: { centerName?: string | null; result?: string | null; wafidGamcaId?: string | null }
  ) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.medicalClearance.findFirst({ where: { tenantId, checklistId } });
    if (existing) {
      await db.medicalClearance.updateMany({
        where: { id: existing.id, tenantId },
        data: input,
      });
      return db.medicalClearance.findFirst({ where: { id: existing.id, tenantId } });
    }
    return db.medicalClearance.create({
      data: {
        tenantId,
        checklistId,
        centerName: input.centerName,
        result: input.result,
        wafidGamcaId: input.wafidGamcaId,
      },
    });
  },

  async saveLaborExitDetails(
    tenantId: string,
    _userId: string,
    checklistId: string,
    input: { clearanceType?: string | null; referenceNo?: string | null }
  ) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.laborExitClearance.findFirst({ where: { tenantId, checklistId } });
    if (existing) {
      await db.laborExitClearance.updateMany({
        where: { id: existing.id, tenantId },
        data: input,
      });
      return db.laborExitClearance.findFirst({ where: { id: existing.id, tenantId } });
    }
    return db.laborExitClearance.create({
      data: {
        tenantId,
        checklistId,
        clearanceType: input.clearanceType,
        referenceNo: input.referenceNo,
      },
    });
  },

  async saveVisaDetails(
    tenantId: string,
    _userId: string,
    checklistId: string,
    input: { visaNumber?: string | null; visaType?: string | null; sponsorName?: string | null }
  ) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.workPermitVisa.findFirst({ where: { tenantId, checklistId } });
    if (existing) {
      await db.workPermitVisa.updateMany({
        where: { id: existing.id, tenantId },
        data: input,
      });
      return db.workPermitVisa.findFirst({ where: { id: existing.id, tenantId } });
    }
    return db.workPermitVisa.create({
      data: {
        tenantId,
        checklistId,
        visaNumber: input.visaNumber,
        visaType: input.visaType,
        sponsorName: input.sponsorName,
      },
    });
  },

  async saveTravelDetails(
    tenantId: string,
    _userId: string,
    checklistId: string,
    input: { flightNumber?: string | null; airline?: string | null; ticketRef?: string | null }
  ) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.travelRecord.findFirst({ where: { tenantId, checklistId } });
    if (existing) {
      await db.travelRecord.updateMany({ where: { id: existing.id, tenantId }, data: input });
      return db.travelRecord.findFirst({ where: { id: existing.id, tenantId } });
    }
    return db.travelRecord.create({
      data: {
        tenantId,
        checklistId,
        flightNumber: input.flightNumber,
        airline: input.airline,
        ticketRef: input.ticketRef,
      },
    });
  },

  async saveDeploymentDetails(
    tenantId: string,
    _userId: string,
    checklistId: string,
    input: { site?: string | null; clientContact?: string | null }
  ) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.deploymentRecord.findFirst({ where: { tenantId, checklistId } });
    if (existing) {
      await db.deploymentRecord.updateMany({ where: { id: existing.id, tenantId }, data: input });
      return db.deploymentRecord.findFirst({ where: { id: existing.id, tenantId } });
    }
    return db.deploymentRecord.create({
      data: {
        tenantId,
        checklistId,
        site: input.site,
        clientContact: input.clientContact,
      },
    });
  },

  async saveAttestationDetails(tenantId: string, _userId: string, checklistId: string) {
    const checklist = await requireChecklist(tenantId, checklistId);
    const existing = await db.attestationChain.findFirst({
      where: { tenantId, checklistId },
      include: { steps: true },
    });
    if (existing) return existing;
    const chain = await db.attestationChain.create({
      data: {
        tenantId,
        checklistId,
        status: "PENDING",
      },
    });
    for (let i = 0; i < AUTHORITIES.length; i++) {
      await db.attestationStep.create({
        data: {
          tenantId,
          chainId: chain.id,
          name: AUTHORITIES[i],
          authority: AUTHORITIES[i],
          stepOrder: i + 1,
          status: "PENDING",
        },
      });
    }
    return db.attestationChain.findFirst({
      where: { id: chain.id, tenantId },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async advanceAttestationStep(
    tenantId: string,
    stepId: string,
    data: { referenceNo?: string | null }
  ) {
    const step = await db.attestationStep.findFirst({ where: { id: stepId, tenantId } });
    if (!step || step.stepOrder == null) throw new NotFoundError("AttestationStep", stepId);
    const chain = await db.attestationChain.findFirst({
      where: { id: step.chainId, tenantId },
      include: { steps: true },
    });
    if (!chain) throw new NotFoundError("AttestationChain", step.chainId);
    const prev = chain.steps.find((s) => s.stepOrder === (step.stepOrder ?? 0) - 1);
    assertAttestationOrder({
      order: step.stepOrder,
      authority: step.authority ?? step.name,
      previousStatus: prev?.status ?? null,
      previousAuthority: prev?.authority ?? prev?.name ?? null,
    });
    await db.attestationStep.updateMany({
      where: { id: step.id, tenantId },
      data: { status: "COMPLETE", completedAt: new Date(), referenceNo: data.referenceNo },
    });
    return db.attestationStep.findFirst({ where: { id: step.id, tenantId } });
  },

  async getDetails(tenantId: string, checklistId: string, connectorId: string | null): Promise<ChecklistDetails> {
    if (connectorId === "wafid") {
      const medical = await db.medicalClearance.findFirst({ where: { tenantId, checklistId } });
      return medical
        ? { kind: "MEDICAL", medical: { id: medical.id, centerName: medical.centerName, result: medical.result } }
        : { kind: "NONE" };
    }
    if (connectorId === "attestation") {
      const chain = await db.attestationChain.findFirst({
        where: { tenantId, checklistId },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      });
      return chain
        ? { kind: "ATTESTATION", chain: { id: chain.id, steps: chain.steps } }
        : { kind: "NONE" };
    }
    if (connectorId === "dmw") {
      const laborExit = await db.laborExitClearance.findFirst({ where: { tenantId, checklistId } });
      return laborExit
        ? { kind: "LABOR_EXIT", laborExit: { id: laborExit.id, clearanceType: laborExit.clearanceType } }
        : { kind: "NONE" };
    }
    if (connectorId === "mohre") {
      const visa = await db.workPermitVisa.findFirst({ where: { tenantId, checklistId } });
      return visa
        ? { kind: "VISA", visa: { id: visa.id, visaNumber: visa.visaNumber, visaType: visa.visaType } }
        : { kind: "NONE" };
    }
    if (connectorId === "travel") {
      const travel = await db.travelRecord.findFirst({ where: { tenantId, checklistId } });
      return travel
        ? { kind: "TRAVEL", travel: { id: travel.id, flightNumber: travel.flightNumber } }
        : { kind: "NONE" };
    }
    if (connectorId === "deployment") {
      const deployment = await db.deploymentRecord.findFirst({ where: { tenantId, checklistId } });
      return deployment
        ? { kind: "DEPLOYMENT", deployment: { id: deployment.id, site: deployment.site } }
        : { kind: "NONE" };
    }
    return { kind: "NONE" };
  },
};
