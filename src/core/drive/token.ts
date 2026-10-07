export type RefreshedToken = { access_token: string; expires_in: number };

const DEFAULT_BUFFER_MS = 5 * 60 * 1000;

/**
 * Returns the current access token, or a refreshed one when within the buffer.
 * Caller persists the refreshed token. No lock: providers accept concurrent refresh.
 */
export async function ensureFreshToken(input: {
  accessToken: string;
  tokenExpiresAt: Date;
  refresh: () => Promise<RefreshedToken>;
  now?: number;
  bufferMs?: number;
}): Promise<{ accessToken: string; refreshed: boolean; tokenExpiresAt: Date }> {
  const now = input.now ?? Date.now();
  const buffer = input.bufferMs ?? DEFAULT_BUFFER_MS;
  if (input.tokenExpiresAt.getTime() - now > buffer) {
    return {
      accessToken: input.accessToken,
      refreshed: false,
      tokenExpiresAt: input.tokenExpiresAt,
    };
  }
  const refreshed = await input.refresh();
  const tokenExpiresAt = new Date(now + refreshed.expires_in * 1000);
  return { accessToken: refreshed.access_token, refreshed: true, tokenExpiresAt };
}
