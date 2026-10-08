export function shouldDeliver(
  event: { type: string; tenantId: string },
  connection: { tenantId: string; eventTypes: Set<string> }
): boolean {
  if (event.tenantId !== connection.tenantId) return false;
  if (connection.eventTypes.size > 0 && !connection.eventTypes.has(event.type)) return false;
  return true;
}

export function parseRealtimePayload(raw: string): { type: string; tenantId: string; payload: unknown } | null {
  try {
    const event = JSON.parse(raw) as { type?: string; tenantId?: string; payload?: unknown };
    if (!event.type || !event.tenantId) return null;
    return { type: event.type, tenantId: event.tenantId, payload: event.payload ?? null };
  } catch {
    return null;
  }
}
