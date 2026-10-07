export interface ExternalDriveClient {
  ensureRootFolder(name: string): Promise<{ id: string; name: string }>;
  ensureFolder(parentId: string, name: string): Promise<{ id: string; name: string }>;
  uploadFile(input: {
    parentId: string;
    name: string;
    mimeType: string;
    content: Buffer;
  }): Promise<{ id: string; url: string }>;
  deleteFile(fileId: string): Promise<void>;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function microsoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MS_OAUTH_CLIENT_ID ?? "",
    redirect_uri: process.env.MS_OAUTH_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "offline_access Files.ReadWrite.AppFolder User.Read",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}
