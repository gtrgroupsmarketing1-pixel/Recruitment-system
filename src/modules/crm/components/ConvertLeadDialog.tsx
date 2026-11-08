"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertLeadToCandidateAction } from "@/modules/crm/crm.actions";

type Lead = {
  id: string;
  profileName: string | null;
  phoneNumber: string;
};

export function ConvertLeadDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            Convert to Candidate
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert WhatsApp lead</DialogTitle>
        </DialogHeader>
        <form
          className="mt-2 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              try {
                const res = await convertLeadToCandidateAction(lead.id, fd);
                setOpen(false);
                router.refresh();
                if (res.candidateId) {
                  router.push(`/candidates/${res.candidateId}`);
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Convert failed");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={lead.profileName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={lead.phoneNumber}
              required
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trade">Trade / skill</Label>
            <Input
              id="trade"
              name="trade"
              placeholder="e.g. Electrician, Forklift operator"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              placeholder="e.g. IN, PK, NP, PH"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create candidate profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
