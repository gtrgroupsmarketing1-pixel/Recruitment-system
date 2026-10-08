"use client";

import { useEffect, useRef, useState } from "react";

export type RealtimeEvent = {
  type: string;
  payload: unknown;
  at: string;
};

export type RealtimeStatus = "connecting" | "connected" | "fallback";

export function useRealtime(
  eventTypes: string[],
  handler: (event: RealtimeEvent) => void,
  options?: { fallbackIntervalMs?: number; fallbackPoll?: () => void }
): { status: RealtimeStatus } {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const typesKey = eventTypes.join(",");

  useEffect(() => {
    let source: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let retryDelay = 1000;
    let closed = false;

    const startFallback = () => {
      if (fallbackTimer) return;
      setStatus("fallback");
      fallbackTimer = setInterval(() => {
        options?.fallbackPoll?.();
      }, options?.fallbackIntervalMs ?? 30_000);
    };
    const stopFallback = () => {
      if (!fallbackTimer) return;
      clearInterval(fallbackTimer);
      fallbackTimer = null;
    };
    const connect = () => {
      if (closed) return;
      source = new EventSource("/api/realtime");
      source.onopen = () => {
        setStatus("connected");
        stopFallback();
        retryDelay = 1000;
      };
      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as RealtimeEvent;
          if (eventTypes.includes(event.type)) handlerRef.current(event);
        } catch {
          return;
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        setStatus("connecting");
        startFallback();
        setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      };
    };
    connect();
    return () => {
      closed = true;
      source?.close();
      stopFallback();
    };
  }, [typesKey, options?.fallbackIntervalMs]);

  return { status };
}
