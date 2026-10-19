import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScreeningService } from "@/modules/screening/screening.service";
import { ScreeningRepo } from "@/modules/screening/screening.repo";
import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { ValidationError, NotFoundError } from "@/lib/errors";

vi.mock("@/modules/screening/screening.repo", () => ({
  ScreeningRepo: {
    findById: vi.fn(),
    findByApplication: vi.fn(),
    create: vi.fn(),
    updateStep: vi.fn(),
    updateScreening: vi.fn(),
  },
}));

vi.mock("@/core/events/event-bus", () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/core/db/client", () => ({
  db: {
    screeningStep: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn()),
  },
}));

const tenant = "ten_1";
const userId = "user_1";
const appId = "app_1";

function screening(overrides: Record<string, any> = {}) {
  return {
    id: "scr_1",
    tenantId: tenant,
    applicationId: appId,
    stage: "SCREENING",
    path: "BLUE_COLLAR",
    outcome: "PENDING",
    overallScore: null,
    scorecard: null,
    result: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    steps: [],
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ScreeningService.startScreening", () => {
  it("creates 3 steps for blue collar", async () => {
    vi.mocked(ScreeningRepo.findByApplication).mockResolvedValue([]);
    vi.mocked(ScreeningRepo.create).mockResolvedValue(screening({ path: "BLUE_COLLAR" }));
    vi.mocked(ScreeningRepo.findById).mockResolvedValue(screening({ path: "BLUE_COLLAR" }));

    const result = await ScreeningService.startScreening(tenant, userId, appId, "BLUE_COLLAR");

    expect(ScreeningRepo.create).toHaveBeenCalledWith(tenant, expect.objectContaining({ applicationId: appId, path: "BLUE_COLLAR" }));
    expect(db.screeningStep.create).toHaveBeenCalledTimes(3);
    expect(result).toBeDefined();
  });

  it("creates 4 steps for white collar", async () => {
    vi.mocked(ScreeningRepo.findByApplication).mockResolvedValue([]);
    vi.mocked(ScreeningRepo.create).mockResolvedValue(screening({ path: "WHITE_COLLAR" }));
    vi.mocked(ScreeningRepo.findById).mockResolvedValue(screening({ path: "WHITE_COLLAR" }));

    const result = await ScreeningService.startScreening(tenant, userId, appId, "WHITE_COLLAR");

    expect(db.screeningStep.create).toHaveBeenCalledTimes(4);
    expect(result).toBeDefined();
  });

  it("returns existing screening when one already exists", async () => {
    const existing = screening({ outcome: "PASSED" });
    vi.mocked(ScreeningRepo.findByApplication).mockResolvedValue([existing]);

    const result = await ScreeningService.startScreening(tenant, userId, appId, "BLUE_COLLAR");

    expect(result).toBe(existing);
    expect(ScreeningRepo.create).not.toHaveBeenCalled();
  });
});

describe("ScreeningService.completeStep", () => {
  it("marks screening FAILED when a step fails", async () => {
    const step = { id: "stp_1", screeningId: "scr_1", stepOrder: 1, status: "PENDING" };
    vi.mocked(db.screeningStep.findFirst).mockResolvedValue(step as any);
    vi.mocked(ScreeningRepo.updateStep).mockResolvedValue({ ...step, status: "FAILED" } as any);
    vi.mocked(ScreeningRepo.updateScreening).mockResolvedValue(screening({ outcome: "FAILED" }) as any);

    const result = await ScreeningService.completeStep(tenant, userId, "scr_1", 1, "FAILED", 0, "fail");

    expect(ScreeningRepo.updateStep).toHaveBeenCalledWith(tenant, "scr_1", 1, expect.objectContaining({ status: "FAILED", completedBy: userId }));
    expect(ScreeningRepo.updateScreening).toHaveBeenCalledWith(tenant, "scr_1", expect.objectContaining({ outcome: "FAILED" }));
    expect(result!.status).toBe("FAILED");
  });

  it("throws NotFoundError when step is missing", async () => {
    vi.mocked(db.screeningStep.findFirst).mockResolvedValue(null);
    await expect(
      ScreeningService.completeStep(tenant, userId, "scr_1", 9, "PASSED")
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ScreeningService.finalizeScreening", () => {
  it("marks PASSED with average score when all steps pass and publishes event", async () => {
    const scr = screening({
      steps: [
        { id: "s1", status: "PASSED", score: 80 },
        { id: "s2", status: "PASSED", score: 90 },
      ],
    });
    vi.mocked(ScreeningRepo.findById).mockResolvedValue(scr as any);
    vi.mocked(ScreeningRepo.updateScreening).mockResolvedValue({ ...scr, outcome: "PASSED", overallScore: 85 } as any);

    const result = await ScreeningService.finalizeScreening(tenant, userId, "scr_1");

    expect(result!.outcome).toBe("PASSED");
    expect(result!.overallScore).toBe(85);
    expect(eventBus.publish).toHaveBeenCalledWith({
      type: "screening.completed",
      tenantId: tenant,
      payload: expect.objectContaining({ outcome: "PASSED", overallScore: 85, actorId: userId }),
    });
  });

  it("throws when a step is still pending", async () => {
    const scr = screening({ steps: [{ id: "s1", status: "PASSED", score: 80 }, { id: "s2", status: "PENDING" }] });
    vi.mocked(ScreeningRepo.findById).mockResolvedValue(scr as any);

    await expect(ScreeningService.finalizeScreening(tenant, userId, "scr_1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("marks FAILED if any step failed", async () => {
    const scr = screening({
      steps: [
        { id: "s1", status: "PASSED", score: 80 },
        { id: "s2", status: "FAILED", score: 0 },
      ],
    });
    vi.mocked(ScreeningRepo.findById).mockResolvedValue(scr as any);
    vi.mocked(ScreeningRepo.updateScreening).mockResolvedValue({ ...scr, outcome: "FAILED", overallScore: null } as any);

    const result = await ScreeningService.finalizeScreening(tenant, userId, "scr_1");
    expect(result!.outcome).toBe("FAILED");
    expect(result!.overallScore).toBeNull();
  });
});
