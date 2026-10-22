"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { AppError, ValidationError } from "@/lib/errors";
import { ClientCompanyService } from "./client.company.service";

export async function createClientCompanyAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "");
  const country = String(formData.get("country") ?? "");
  try {
    if (!name.trim()) throw new ValidationError("Name is required");
    if (!code.trim()) throw new ValidationError("Code is required");

    const created = await withSessionScope(async (scope) => {
      return ClientCompanyService.create(scope.tenantId, {
        name,
        code,
        country: country || null,
      });
    });
    redirect(`/admin/clients/${created.id}/users`);
  } catch (error) {
    // Next.js redirect throws; rethrow so it still works
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not create client";
    redirect(`/admin/clients/new?error=${encodeURIComponent(message)}`);
  }
}

export async function updateClientCompanyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const country = String(formData.get("country") ?? "");
  try {
    await withSessionScope(async (scope) => {
      await ClientCompanyService.update(scope.tenantId, id, {
        name,
        country: country || null,
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not update client";
    redirect(`/admin/clients?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/clients");
}

export async function deleteClientCompanyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  try {
    await withSessionScope(async (scope) => {
      await ClientCompanyService.softDelete(scope.tenantId, id);
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not delete client";
    redirect(`/admin/clients?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/clients");
}
