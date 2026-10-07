export type BottleneckCounts = {
  stepName: string;
  stepOrder: number;
  casesStuck: number;
  totalCases: number;
  averageDaysStuck: number;
};

export function summarizeBottlenecks(rows: BottleneckCounts[]) {
  return [...rows]
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((row) => ({
      ...row,
      pctStuck: row.totalCases === 0 ? 0 : (row.casesStuck / row.totalCases) * 100,
    }));
}
