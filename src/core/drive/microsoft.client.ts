import type { ExternalDriveClient } from "./drive.client";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

function assertOk(res: Response, body: Record<string, unknown>, label: string): void {
  if (res.ok) return;
  const err = body.error;
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : typeof err === "string"
        ? err
        : label;
  throw new Error(message);
}

export async function microsoftExchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.MS_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.MS_OAUTH_CLIENT_SECRET ?? "",
    redirect_uri: process.env.MS_OAUTH_REDIRECT_URI ?? "",
    grant_type: "authorization_code",
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await readJson(res);
  assertOk(res, json, "microsoft_exchange_failed");
  return json as unknown as TokenResponse;
}

export async function microsoftRefresh(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.MS_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.MS_OAUTH_CLIENT_SECRET ?? "",
    redirect_uri: process.env.MS_OAUTH_REDIRECT_URI ?? "",
    grant_type: "refresh_token",
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await readJson(res);
  assertOk(res, json, "microsoft_refresh_failed");
  return json as unknown as TokenResponse;
}

export async function microsoftGetUserInfo(accessToken: string): Promise<{ id: string; email: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await readJson(res);
  assertOk(res, json, "microsoft_userinfo_failed");
  const email = String(json.mail ?? json.userPrincipalName ?? "");
  return { id: String(json.id ?? ""), email };
}

export function createMicrosoftDriveClient(accessToken: string): ExternalDriveClient {
  const auth = { Authorization: `Bearer ${accessToken}` };

  async function ensureFolder(parentId: string, name: string): Promise<{ id: string; name: string }> {
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children?$select=id,name,folder`,
      { headers: auth }
    );
    const list = await readJson(listRes);
    assertOk(listRes, list, "microsoft_list_failed");
    const items = (list.value as Array<{ id: string; name: string; folder?: unknown }> | undefined) ?? [];
    const found = items.find((item) => item.name === name && item.folder);
    if (found) return { id: found.id, name: found.name };
    const createRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }),
    });
    const created = await readJson(createRes);
    assertOk(createRes, created, "microsoft_folder_failed");
    return { id: String(created.id), name: String(created.name ?? name) };
  }

  return {
    async ensureRootFolder(name) {
      const rootRes = await fetch("https://graph.microsoft.com/v1.0/me/drive/special/approot", {
        headers: auth,
      });
      const root = await readJson(rootRes);
      assertOk(rootRes, root, "microsoft_approot_failed");
      return ensureFolder(String(root.id), name);
    },
    ensureFolder,
    async uploadFile({ parentId, name, mimeType, content }) {
      const safe = encodeURIComponent(name);
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}:/${safe}:/content`,
        {
          method: "PUT",
          headers: { ...auth, "Content-Type": mimeType },
          body: new Uint8Array(content),
        }
      );
      const json = await readJson(res);
      assertOk(res, json, "microsoft_upload_failed");
      const id = String(json.id);
      const url = typeof json.webUrl === "string" ? json.webUrl : `https://onedrive.live.com/?id=${id}`;
      return { id, url };
    },
    async deleteFile(fileId) {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        method: "DELETE",
        headers: auth,
      });
      if (!res.ok && res.status !== 404) throw new Error("microsoft_delete_failed");
    },
  };
}
