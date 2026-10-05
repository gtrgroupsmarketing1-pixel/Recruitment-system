import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/requisition/requisition.repo", () => ({
  RequisitionRepo: {
    findClient: vi.fn(),
    findUser: vi.fn(),
    findMaxSeqForPrefix: vi.fn(),
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    countMobilized: vi.fn(),
  },
}));

import { RequisitionRepo } from "@/modules/requisition/requisition.repo";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { ConflictError, NotFoundError } from "@/lib/errors";

const repo = RequisitionRepo as unknown as {
  findClient: ReturnType<typeof vi.fn>;
  findUser: ReturnType<typeof vi.fn>;
  findMaxSeqForPrefix: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  countMobilized: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("RequisitionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create generates Req ID and returns row", async () => {
    repo.findClient.mockResolvedValue({ id: "c1", name: "Emirates", code: "EMR" });
    repo.findMaxSeqForPrefix.mockResolvedValue(13);
    repo.create.mockImplementation(async (_t: string, data: { reqCode: string }) => ({
      id: "r1",
      ...data,
    }));

    const row = await RequisitionService.create("t1", "u1", {
      clientCompanyId: "c1",
      roleCategory: "BC",
      country: "AE",
      vacancyTarget: 10,
    });
    expect(row.reqCode).toMatch(/^EMR-AE-BC-\d{6}-014$/);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("create retries once on P2002", async () => {
    repo.findClient.mockResolvedValue({ id: "c1", name: "Emirates", code: "EMR" });
    repo.findMaxSeqForPrefix.mockResolvedValue(1);
    const collision = Object.assign(new Error("unique"), { code: "P2002" });
    repo.create
      .mockRejectedValueOnce(collision)
      .mockImplementationOnce(async (_t: string, data: { reqCode: string }) => ({
        id: "r2",
        ...data,
      }));
    const row = await RequisitionService.create("t1", "u1", {
      clientCompanyId: "c1",
      roleCategory: "BC",
      country: "AE",
      vacancyTarget: 1,
    });
    expect(row.reqCode).toMatch(/-003$/);
    expect(repo.create).toHaveBeenCalledTimes(2);
  });

  it("create throws ConflictError on double P2002", async () => {
    repo.findClient.mockResolvedValue({ id: "c1", name: "Emirates", code: "EMR" });
    repo.findMaxSeqForPrefix.mockResolvedValue(1);
    const collision = Object.assign(new Error("unique"), { code: "P2002" });
    repo.create.mockRejectedValue(collision);
    await expect(
      RequisitionService.create("t1", "u1", {
        clientCompanyId: "c1",
        roleCategory: "BC",
        country: "AE",
        vacancyTarget: 1,
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("list enriches fulfillment and slaFlag", async () => {
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + 10);
    repo.list.mockResolvedValue([
      {
        id: "r1",
        tenantId: "t1",
        clientCompanyId: "c1",
        reqCode: "EMR-AE-BC-202610-001",
        vacancyTarget: 10,
        targetOnboardingDate: target,
      },
    ]);
    repo.findClient.mockResolvedValue({ id: "c1", name: "Emirates", code: "EMR" });
    repo.countMobilized.mockResolvedValue(5);
    const views = await RequisitionService.list("t1", {});
    expect(views[0].fulfillment.pct).toBe(50);
    expect(views[0].slaFlag).toBe("RED");
    expect(views[0].client.code).toBe("EMR");
  });

  it("assignRecruiter rejects unknown user", async () => {
    repo.findUser.mockResolvedValue(null);
    await expect(
      RequisitionService.assignRecruiter("t1", "u1", "r1", "missing")
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
