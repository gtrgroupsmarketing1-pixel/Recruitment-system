import Link from "next/link";
import type { RiskCaseView } from "@/modules/compliance/compliance.dashboard.service";
import { RiskBadge } from "./RiskBadge";

type Props = { cases: RiskCaseView[] };

export function AtRiskTable({ cases }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-neutral-500">
          <th>Candidate</th><th>Req</th><th>Days left</th><th>Risk</th><th>Blocking</th>
        </tr>
      </thead>
      <tbody>
        {cases.map((row) => (
          <tr key={row.caseId} className="border-t">
            <td><Link href={`/compliance/cases/${row.caseId}`}>{row.candidateName}</Link></td>
            <td>{row.requisitionCode}</td>
            <td>{row.risk.daysUntilTarget ?? "—"}</td>
            <td><RiskBadge level={row.risk.level} score={row.risk.score} /></td>
            <td>{row.risk.blockingStepName ?? "none"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
