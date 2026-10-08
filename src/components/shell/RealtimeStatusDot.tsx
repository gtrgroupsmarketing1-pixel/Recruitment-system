"use client";

import { useRealtime } from "@/core/realtime/use-realtime";

export function RealtimeStatusDot() {
  const { status } = useRealtime([], () => undefined);
  const color = status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-amber-500" : "bg-gray-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} title={status} />;
}
