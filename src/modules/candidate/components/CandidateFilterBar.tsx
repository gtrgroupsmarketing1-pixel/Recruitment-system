"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NATIONALITIES = ["IN", "PK", "NP", "PH", "BD", "EG", "LK", "OTHER"];
const POOLS = [
  { value: "", label: "All pool status" },
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_PROCESS", label: "In process" },
  { value: "DEPLOYED", label: "Deployed" },
];

export function CandidateFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      p.set("page", "1");
      startTransition(() => {
        router.replace(`/candidates?${p.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center ${pending ? "opacity-70" : ""}`}
    >
      <Input
        key={searchParams.get("q") ?? ""}
        name="q"
        defaultValue={searchParams.get("q") ?? ""}
        placeholder="Search name, phone, or email…"
        className="sm:max-w-xs"
        onChange={(e) => {
          const v = e.target.value;
          window.clearTimeout((window as unknown as { __cTimer?: number }).__cTimer);
          (window as unknown as { __cTimer?: number }).__cTimer = window.setTimeout(() => {
            pushParams((p) => {
              if (v.trim()) p.set("q", v.trim());
              else p.delete("q");
            });
          }, 350);
        }}
      />
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        defaultValue={searchParams.get("nationality") ?? ""}
        onChange={(e) =>
          pushParams((p) => {
            if (e.target.value) p.set("nationality", e.target.value);
            else p.delete("nationality");
          })
        }
      >
        <option value="">All nationalities</option>
        {NATIONALITIES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        defaultValue={searchParams.get("pool") ?? ""}
        onChange={(e) =>
          pushParams((p) => {
            if (e.target.value) p.set("pool", e.target.value);
            else p.delete("pool");
          })
        }
      >
        {POOLS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        defaultValue={searchParams.get("portal") ?? ""}
        onChange={(e) =>
          pushParams((p) => {
            if (e.target.value) p.set("portal", e.target.value);
            else p.delete("portal");
          })
        }
      >
        <option value="">All portal</option>
        <option value="INVITED">INVITED</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="DISABLED">DISABLED</option>
      </select>
      {(searchParams.get("q") ||
        searchParams.get("nationality") ||
        searchParams.get("pool") ||
        searchParams.get("portal")) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.replace("/candidates"))}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
