import { linkCandidateAction } from "@/modules/application/link.action";
import { formatCandidateName, maskPhone } from "./format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = { 
  data: any; 
  requisitions: { id: string; reqCode: string }[]; 
};

export function CandidateDetail({ data, requisitions }: Props) {
  return (
    <div className="grid gap-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {formatCandidateName({ fullName: data.fullName })}
        </h1>
        <p className="text-sm">Phone: {data.phone ? maskPhone(data.phone) : "—"}</p>
        <p className="text-sm">Email: {data.email ?? "—"}</p>
        <p className="text-sm">Passport: {data.passportNumber ?? "—"}</p>
        <p className="text-sm">National ID: {data.nationalId ?? "—"}</p>
        <p className="text-sm">Medical: {data.medicalResult ?? "—"}</p>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Link to Requisition</h2>
        {requisitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open requisitions found. Create one first.</p>
        ) : (
          <form action={linkCandidateAction} className="flex items-end gap-4">
            <input type="hidden" name="candidateId" value={data.id} />
            <div className="flex-1 space-y-2">
              <select
                name="requisitionId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a requisition...</option>
                {requisitions.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.reqCode}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Link</Button>
          </form>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-2">Applications</h2>
        {(!data.applications || data.applications.length === 0) ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {data.applications.map((app: any) => (
              <Card key={app.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{app.requisition?.reqCode ?? "Unknown Req"}</p>
                  <p className="text-sm text-muted-foreground">Status: {app.status}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}