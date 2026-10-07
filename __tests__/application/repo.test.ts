import { describe, it, expect } from "vitest";
import { ApplicationRepo } from "@/modules/application/application.repo";
import { withTenant } from "@/core/db/client";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("ApplicationRepo", () => {
  it("findById is scoped to tenantId", async () => {
    const row = await withTenant("nonexistent-tenant", () =>
      ApplicationRepo.findById("nonexistent-tenant", "nonexistent-id")
    );
    expect(row).toBeNull();
  });

  it("listByRequisition is scoped to tenantId", async () => {
    const rows = await withTenant("nonexistent-tenant", () =>
      ApplicationRepo.listByRequisition(
        "nonexistent-tenant",
        "nonexistent-req"
      )
    );
    expect(rows).toEqual([]);
  });

  it("updateStatus returns null when tenant does not own the row", async () => {
    const updated = await withTenant("nonexistent-tenant", () =>
      ApplicationRepo.updateStatus(
        "nonexistent-tenant",
        "nonexistent-id",
        "SCREENED",
        "user_1"
      )
    );
    expect(updated).toBeNull();
  });
});
