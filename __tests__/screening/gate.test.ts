import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "@/modules/application/application.service";
import { ApplicationRepo } from "@/modules/application/application.repo";
import { ScreeningRepo } from "@/modules/screening/screening.repo";
import { ScreeningService } from "@/modules/screening/screening.service";
import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { ValidationError, NotFoundError } from "@/lib/errors";
import type { ApplicationStatus } from "@prisma/client";

vi.mock("@/modules/application/application.repo", () => ({
  ApplicationRepo: {
    findById: vi.fn(),
    findByCandidateAndRequisition: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
}));
vi.mock("@/modules/screening/screening.repo", () => ({
  ScreeningRepo: { findByApplication: vi.fn() },
}));
vi.mock("@/modules/screening/screening.service", () => ({
  ScreeningService: { startScreening: vi.fn().mockResolvedValue({ id: "scr_1" }) },
}));
vi.mock("@/core/events/event-bus", () => ({
  eventBus: { publish: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/core/db/client", () => ({
  db: {
    $transaction: vi.fn(async (fn: any) => fn()),
    candidate: { findFirst: vi.fn() },
    jobRequisition: { findFirst: vi.fn() },
  },
}));

const tenant = "ten_1";
const userId = "user_1";

function app(overrides: Partial<{ id: string; status: ApplicationStatus }> = {}) {
  return {
    id: "app_1",
    tenantId: tenant,
    candidateId: "cand_1",
    requisitionId: "req_1",
    status: "SCREENED" as ApplicationStatus,
    recruiterId: null,
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApplicationService.changeStatus shortlist gate", () => {
  it("blocks SHORTLISTED when no screening passed", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(app());
    vi.mocked(ScreeningRepo.findByApplication).mockResolvedValue([
      { outcome: "FAILED" },
    ] as any);

    await expect(
      ApplicationService.changeStatus(tenant, userId, "app_1", "SHORTLISTED")
    ).rejects.toBeInstanceOf(ValidationError);

    expect(ApplicationRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("allows SHORTLISTED when a screening is PASSED", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(app());
    vi.mocked(ScreeningRepo.findByApplication).mockResolvedValue([
      { outcome: "PASSED" },
    ] as any);
    vi.mocked(ApplicationRepo.updateStatus).mockResolvedValue(app({ status: "SHORTLISTED" }));

    const result = await ApplicationService.changeStatus(
      tenant,
      userId,
      "app_1",
      "SHORTLISTED"
    );

    expect(result.status).toBe("SHORTLISTED");
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it("throws NotFoundError when application missing", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(null);
    await expect(
      ApplicationService.changeStatus(tenant, userId, "app_1", "SHORTLISTED")
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ApplicationService.create starts screening", () => {
  it("creates the application and starts screening inside the transaction", async () => {
    vi.mocked(ApplicationRepo.findByCandidateAndRequisition).mockResolvedValue(null);
    vi.mocked(ApplicationRepo.create).mockResolvedValue(app({ status: "SOURCED" }));
    vi.mocked(db.candidate.findFirst).mockResolvedValue({
      id: "cand_1",
      tenantId: "t1",
      fullName: "Test Candidate",
    } as any);
    vi.mocked(db.jobRequisition.findFirst).mockResolvedValue({
      id: "req_1",
      tenantId: "t1",
      roleCategory: "BC",
    } as any);

    await ApplicationService.create(tenant, userId, {
      candidateId: "cand_1",
      requisitionId: "req_1",
      path: "BLUE_COLLAR",
    });

    expect(ApplicationRepo.create).toHaveBeenCalledWith(tenant, {
      candidateId: "cand_1",
      requisitionId: "req_1",
      recruiterId: undefined,
    });
    expect(ScreeningService.startScreening).toHaveBeenCalledWith(
      tenant,
      userId,
      "app_1",
      "BLUE_COLLAR"
    );
    expect(db.$transaction).toHaveBeenCalled();
  });
});
