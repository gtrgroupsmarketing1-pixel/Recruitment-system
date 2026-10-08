"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/core/realtime/use-realtime";
import { useDebouncedCallback } from "@/lib/debounce";

export function RealtimeRefresher({ eventTypes }: { eventTypes: string[] }) {
  const router = useRouter();
  const refresh = useDebouncedCallback(() => router.refresh(), 500);
  useRealtime(eventTypes, refresh, {
    fallbackIntervalMs: 30_000,
    fallbackPoll: refresh,
  });
  return null;
}
