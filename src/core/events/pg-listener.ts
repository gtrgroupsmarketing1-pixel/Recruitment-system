import { Client } from "pg";
import { logger } from "@/lib/logger";

type Listener = (channel: string, payload: string) => void;

let client: Client | null = null;
let connected = false;
const listeners = new Set<Listener>();

export async function ensureListener(): Promise<void> {
  if (connected && client) return;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;
  client = new Client({ connectionString });
  await client.connect();
  await client.query("LISTEN domain_events");
  connected = true;
  client.on("notification", (msg) => {
    if (!msg.payload) return;
    for (const fn of listeners) {
      try {
        fn(msg.channel, msg.payload);
      } catch (err) {
        logger.error({ err: String(err) }, "listener callback threw");
      }
    }
  });
  client.on("error", (err) => {
    logger.error({ err: String(err) }, "pg listener error");
    connected = false;
    client = null;
    setTimeout(() => {
      ensureListener().catch(() => undefined);
    }, 5000);
  });
}

export function subscribeToDomainEvents(fn: Listener): () => void {
  listeners.add(fn);
  void ensureListener();
  return () => listeners.delete(fn);
}
