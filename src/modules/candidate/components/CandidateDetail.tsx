import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = {
  candidate: any;
};

export function CandidateDetail({ candidate }: Props) {
  if (!candidate) return null;

  const safeDate = (date: any) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{candidate.fullName}</h1>
        <Badge variant="outline">{candidate.status || "NEW"}</Badge>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p>{candidate.phone || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{candidate.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nationality</p>
            <p>{candidate.nationality || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Passport</p>
            <p className="font-mono">{candidate.passportNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">National ID</p>
            <p className="font-mono">{candidate.nationalId || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p>{safeDate(candidate.createdAt)}</p>
          </div>
        </div>
      </Card>

      {candidate.applications && candidate.applications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Applications</h2>
          <div className="space-y-2">
            {candidate.applications.map((app: any) => (
              <Card key={app.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{app.requisition?.reqCode || "Unknown Req"}</p>
                  <p className="text-sm text-muted-foreground">{app.status}</p>
                </div>
                <Link href={`/requisitions/${app.requisitionId}`} className="text-sm underline">
                  View Requisition
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}