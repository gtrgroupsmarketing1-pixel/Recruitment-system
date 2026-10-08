"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { ValidationError } from "@/lib/errors";
import { ClientUserService } from "./client.user.service";

export async function createClientUserAction(formData: FormData) {
  const clientCompanyId = String(formData.get("clientCompanyId") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password !== confirm) throw new ValidationError("Passwords do not match");
  await withSessionScope(async (scope) => {
    requirePermission("client_user:manage");
    await ClientUserService.create(scope.tenantId, scope.userId, {
      clientCompanyId,
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      password,
    });
  });
  redirect(`/admin/clients/${clientCompanyId}/users`);
}

export async function setClientUserActiveAction(formData: FormData) {
  const clientCompanyId = String(formData.get("clientCompanyId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "");
  await withSessionScope(async (scope) => {
    requirePermission("client_user:manage");
    if (active === "1") {
      await ClientUserService.reactivate(scope.tenantId, scope.userId, userId);
    } else {
      await ClientUserService.deactivate(scope.tenantId, scope.userId, userId);
    }
  });
  redirect(`/admin/clients/${clientCompanyId}/users`);
}
