export type CsvCase = {
  candidateName: string;
  requisitionCode: string;
  riskLevel: string;
  score: number;
  blockingStepName: string | null;
  daysUntilTarget: number | null;
};

function cell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: CsvCase[]): string {
  const header = "candidate,requisition,risk,score,blocking,daysUntilTarget";
  const body = rows.map((row) =>
    [
      cell(row.candidateName),
      cell(row.requisitionCode),
      cell(row.riskLevel),
      String(row.score),
      cell(row.blockingStepName ?? ""),
      row.daysUntilTarget === null ? "" : String(row.daysUntilTarget),
    ].join(",")
  );
  return [header, ...body].join("\n");
}
