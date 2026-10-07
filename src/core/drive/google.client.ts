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
  const message = typeof body.error === "string" ? body.error : label;
  throw new Error(message);
}

export async function googleExchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await readJson(res);
  assertOk(res, json, "google_exchange_failed");
  return json as unknown as TokenResponse;
}

export async function googleRefresh(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await readJson(res);
  assertOk(res, json, "google_refresh_failed");
  return json as unknown as TokenResponse;
}

export async function googleGetUserInfo(accessToken: string): Promise<{ id: string; email: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await readJson(res);
  assertOk(res, json, "google_userinfo_failed");
  return { id: String(json.id ?? ""), email: String(json.email ?? "") };
}

export function createGoogleDriveClient(accessToken: string): ExternalDriveClient {
  const auth = { Authorization: `Bearer ${accessToken}` };

  async function ensureFolder(parentId: string | null, name: string): Promise<{ id: string; name: string }> {
    const escaped = name.replace(/'/g, "\\'");
    const parentClause = parentId ? ` and '${parentId}' in parents` : "";
    const q = `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`;
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&pageSize=1`,
      { headers: auth }
    );
    const list = await readJson(listRes);
    assertOk(listRes, list, "google_list_failed");
    const files = (list.files as Array<{ id: string; name: string }> | undefined) ?? [];
    if (files[0]) return { id: files[0].id, name: files[0].name };
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined,
      }),
    });
    const created = await readJson(createRes);
    assertOk(createRes, created, "google_folder_failed");
    return { id: String(created.id), name: String(created.name ?? name) };
  }

  return {
    ensureRootFolder: (name) => ensureFolder(null, name),
    ensureFolder: (parentId, name) => ensureFolder(parentId, name),
    async uploadFile({ parentId, name, mimeType, content }) {
      const boundary = `gcc${Date.now()}`;
      const meta = JSON.stringify({ name, parents: [parentId] });
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
        ),
        content,
        Buffer.from(`\r\n--${boundary}--`),
      ]);
      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
        {
          method: "POST",
          headers: {
            ...auth,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );
      const json = await readJson(res);
      assertOk(res, json, "google_upload_failed");
      const id = String(json.id);
      const url = typeof json.webViewLink === "string" ? json.webViewLink : `https://drive.google.com/file/d/${id}/view`;
      return { id, url };
    },
    async deleteFile(fileId) {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: auth,
      });
      if (!res.ok && res.status !== 404) {
        throw new Error("google_delete_failed");
      }
    },
  };
}
