import { NextRequest } from "next/server";
import type { ExternalProvider } from "@prisma/client";
import { withSystemScope, db } from "@/core/db/client";
import { createGoogleDriveClient, googleExchangeCode, googleGetUserInfo } from "@/core/drive/google.client";
import {
  createMicrosoftDriveClient,
  microsoftExchangeCode,
  microsoftGetUserInfo,
} from "@/core/drive/microsoft.client";
import { verifyState } from "@/core/oauth/state";

function providerEnum(provider: "google" | "microsoft"): ExternalProvider {
  return provider === "google" ? "GOOGLE_DRIVE" : "ONEDRIVE";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (provider !== "google" && provider !== "microsoft") {
    return new Response("Unknown provider", { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return new Response("Missing code or state", { status: 400 });
  const claims = verifyState(state);
  if (!claims || claims.provider !== provider) return new Response("Invalid state", { status: 400 });

  const tokens =
    claims.provider === "google" ? await googleExchangeCode(code) : await microsoftExchangeCode(code);
  if (!tokens.refresh_token) return new Response("Provider did not return a refresh token", { status: 400 });
  const userInfo =
    claims.provider === "google"
      ? await googleGetUserInfo(tokens.access_token)
      : await microsoftGetUserInfo(tokens.access_token);
  const client =
    claims.provider === "google"
      ? createGoogleDriveClient(tokens.access_token)
      : createMicrosoftDriveClient(tokens.access_token);

  await withSystemScope(claims.tenantId, "oauth:drive-callback", async () => {
    const tenant = await db.tenant.findFirst({ where: { id: claims.tenantId } });
    const rootName = tenant?.name ?? "Recruitment System";
    const folder = await client.ensureRootFolder(rootName);
    const providerValue = providerEnum(claims.provider);
    const data = {
      externalAccountId: userInfo.id,
      externalEmail: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token as string,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      rootFolderId: folder.id,
      rootFolderName: folder.name,
      scopes: tokens.scope ?? (claims.provider === "google" ? "https://www.googleapis.com/auth/drive.file" : "Files.ReadWrite.AppFolder"),
      connectedBy: claims.userId,
      deletedAt: null,
      lastError: null,
    };
    await db.tenantStorageConnection.upsert({
      where: { tenantId_provider: { tenantId: claims.tenantId, provider: providerValue } },
      create: { tenantId: claims.tenantId, provider: providerValue, ...data },
      update: data,
    });
  });

  return Response.redirect(new URL(`/admin/integrations?connected=${claims.provider}`, req.url));
}
