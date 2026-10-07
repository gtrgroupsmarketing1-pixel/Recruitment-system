import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "@/modules/application/application.service";
import { ApplicationRepo } from "@/modules/application/application.repo";
import { IllegalTransitionError } from "@/modules/application/application.state-machine";
import { NotFoundError } from "@/lib/errors";
import type { ApplicationStatus } from "@prisma/client";

vi.mock("@/modules/application/application.repo", () => ({
  ApplicationRepo: {
    findById: vi.fn(),
    updateStatus: vi.fn(),
    listByRequisition: vi.fn(),
  },
}));

vi.mock("@/core/events/event-bus", () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue(undefined),
    dispatchPending: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}));

const tenantA = "ten_a";
const tenantB = "ten_b";
const userId = "user_1";

function app(
  overrides: Partial<{
    id: string;
    tenantId: string;
    status: ApplicationStatus;
  }> = {}
) {
  return {
    id: "app_1",
    tenantId: tenantA,
    candidateId: "cand_1",
    requisitionId: "req_1",
    status: "SOURCED" as ApplicationStatus,
    recruiterId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("ApplicationService.changeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds on a legal transition and persists via repo", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(
      app({ status: "SOURCED" })
    );
    vi.mocked(ApplicationRepo.updateStatus).mockResolvedValue(
      app({ status: "SCREENED" })
    );

    const result = await ApplicationService.changeStatus(
      tenantA,
      userId,
      "app_1",
      "SCREENED"
    );

    expect(ApplicationRepo.findById).toHaveBeenCalledWith(tenantA, "app_1");
    expect(ApplicationRepo.updateStatus).toHaveBeenCalledWith(
      tenantA,
      "app_1",
      "SCREENED",
      userId
    );
    expect(result.status).toBe("SCREENED");
  });

  it("throws IllegalTransitionError on an illegal transition", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(
      app({ status: "SOURCED" })
    );

    await expect(
      ApplicationService.changeStatus(tenantA, userId, "app_1", "SELECTED")
    ).rejects.toBeInstanceOf(IllegalTransitionError);

    expect(ApplicationRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when application is missing", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(null);

    await expect(
      ApplicationService.changeStatus(tenantA, userId, "missing", "SCREENED")
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(ApplicationRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when application belongs to another tenant", async () => {
    vi.mocked(ApplicationRepo.findById).mockResolvedValue(null);

    await expect(
      ApplicationService.changeStatus(tenantB, userId, "app_1", "SCREENED")
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(ApplicationRepo.findById).toHaveBeenCalledWith(tenantB, "app_1");
    expect(ApplicationRepo.updateStatus).not.toHaveBeenCalled();
  });
});
