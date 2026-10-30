"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { AppError } from "@/lib/errors";
import { StaffUserService } from "./staff-user.service";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createStaffUserAction(formData: FormData) {
  try {
    await withSessionScope(async (scope) => {
      requirePermission("user:invite");
      await StaffUserService.create(scope.tenantId, scope.userId, {
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? "RECRUITER") as UserRole,
        branchId: String(formData.get("branchId") ?? "") || null,
      });
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not create user";
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/users");
}

export async function updateStaffRoleAction(formData: FormData) {
  try {
    await withSessionScope(async (scope) => {
      requirePermission("user:update_role");
      await StaffUserService.updateRole(
        scope.tenantId,
        scope.userId,
        String(formData.get("userId") ?? ""),
        String(formData.get("role") ?? "") as UserRole,
        String(formData.get("branchId") ?? "") || null
      );
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not update role";
    return { error: message };
  }
}

export async function setStaffActiveAction(formData: FormData) {
  try {
    await withSessionScope(async (scope) => {
      requirePermission("user:deactivate");
      await StaffUserService.setActive(
        scope.tenantId,
        scope.userId,
        String(formData.get("userId") ?? ""),
        String(formData.get("active") ?? "") === "1"
      );
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not update user";
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/users");
}
