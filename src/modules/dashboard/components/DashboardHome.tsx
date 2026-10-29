import Link from "next/link";
import type {
  ActivityItem,
  DashboardKpis,
  PipelineStage,
  UrgentRequisitionRow,
} from "@/modules/dashboard/dashboard.service";
import type { TaskView } from "@/modules/task/task.service";
import { QuickActions } from "./QuickActions";
import { DashboardTaskList } from "./DashboardTaskList";
import { PipelineBar } from "./PipelineBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Props = {
  firstName: string;
  kpis: DashboardKpis;
  pipeline: PipelineStage[];
  urgentReqs: UrgentRequisitionRow[];
  tasks: TaskView[];
  activity: ActivityItem[];
};

function slaCountdown(days: number | null) {
  if (days == null) {
    return <Badge variant="outline">No target</Badge>;
  }
  if (days < 0) {
    return (
      <Badge variant="destructive" className="tabular-nums">
        {days}d overdue
      </Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500 tabular-nums">
        {days}d left
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 tabular-nums">
      {days}d left
    </Badge>
  );
}

export function DashboardHome({
  firstName,
  kpis,
  pipeline,
  urgentReqs,
  tasks,
  activity,
}: Props) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">
            Agency operations at a glance
          </p>
        </div>
        <QuickActions />
      </div>

      <form action="/candidates" method="get" className="max-w-xl">
        <Input
          name="q"
          placeholder="Search candidates by name, phone, or ID…"
          aria-label="Global candidate search"
        />
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active requisitions</CardTitle>
            <CardDescription>
              {kpis.activeReqsThisWeek > 0
                ? `+${kpis.activeReqsThisWeek} this week`
                : "No new this week"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{kpis.activeReqs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In pipeline</CardTitle>
            <CardDescription>
              {kpis.pipelineCount} total · {kpis.inScreening} in screening
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{kpis.pipelineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending tasks</CardTitle>
            <CardDescription>
              {kpis.overdueTasks > 0 ? (
                <span className="font-medium text-destructive">
                  {kpis.overdueTasks} overdue
                </span>
              ) : (
                "None overdue"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{kpis.pendingTasks}</p>
          </CardContent>
        </Card>
        <Link href="/documents" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance alerts</CardTitle>
              <CardDescription>
                {kpis.docsExpiring} docs expiring · open documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {kpis.complianceAlerts}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate pipeline</CardTitle>
          <CardDescription>
            Stage mix and drop-off across active applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineBar stages={pipeline} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Urgent requisitions</CardTitle>
              <CardDescription>Soonest onboarding target first</CardDescription>
            </div>
            <Link
              href="/requisitions?status=OPEN"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {urgentReqs.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No open requisitions.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Req</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Filled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgentReqs.map((req) => {
                    const pct = Math.min(
                      100,
                      Math.round(
                        (req.fulfillment.mobilized /
                          Math.max(req.fulfillment.target, 1)) *
                          100
                      )
                    );
                    return (
                      <TableRow key={req.id} className="cursor-pointer">
                        <TableCell>
                          <Link
                            href={`/requisitions/${req.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                          >
                            {req.reqCode}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate">
                          <Link href={`/requisitions/${req.id}`} className="hover:underline">
                            {req.client.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/requisitions/${req.id}`}>{req.roleCategory}</Link>
                        </TableCell>
                        <TableCell>{slaCountdown(req.slaDays)}</TableCell>
                        <TableCell className="min-w-[8rem]">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                              {req.fulfillment.mobilized}/{req.fulfillment.target}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s tasks</CardTitle>
              <CardDescription>Tap the box to complete</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardTaskList initialTasks={tasks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest audit events</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="border-b border-border/60 pb-2 last:border-0"
                    >
                      <p className="text-sm leading-snug">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}{" "}
                        UTC
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
