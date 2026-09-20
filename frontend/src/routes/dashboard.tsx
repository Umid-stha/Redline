import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Sparkline, StatusPill } from "@/components/app-shell";
import { eventsOverTime, relativeTime } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — Redline" },
      {
        name: "description",
        content: "Error volume, open issues and recent regressions across all your Redline projects.",
      },
      { property: "og:title", content: "Overview — Redline" },
      {
        property: "og:description",
        content: "Error volume, open issues and recent regressions across your projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { projects, issues } = useStore();
  const open = issues.filter((i) => i.status === "open");
  const resolved = issues.filter((i) => i.status === "resolved");
  const totalEvents = issues.reduce((sum, i) => sum + i.totalOccurrences, 0);

  const stats = [
    { label: "Events (24h)", value: totalEvents.toLocaleString() },
    { label: "Open issues", value: open.length },
    { label: "Resolved", value: resolved.length },
    { label: "Projects", value: projects.length },
  ];

  const recent = [...issues].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, 6);

  return (
    <AppShell breadcrumb={<span className="mono-label">overview</span>}>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aggregated across {projects.length} projects · last 24 hours
      </p>

      <div className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface p-5">
            <p className="mono-label">{s.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="mono-label">events over time · hourly</span>
          <span className="font-mono text-xs text-muted-foreground">24h</span>
        </div>
        <div className="h-64 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={eventsOverTime}>
              <defs>
                <linearGradient id="err" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={3}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 2,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="errors"
                stroke="var(--color-chart-1)"
                fill="url(#err)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="warnings"
                stroke="var(--color-chart-2)"
                fill="transparent"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <span className="mono-label">most recent issues</span>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((issue) => {
            const project = projects.find((p) => p.id === issue.projectId);
            return (
              <li key={issue.id}>
                <Link
                  to="/projects/$projectId/issues/$issueId"
                  params={{ projectId: issue.projectId, issueId: issue.id }}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm">{issue.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project?.name ?? "unknown"} · {issue.culprit}
                    </p>
                  </div>
                  <Sparkline data={issue.sparkline} />
                  <StatusPill status={issue.level} />
                  <span className="hidden w-16 text-right font-mono text-xs text-muted-foreground sm:block">
                    {relativeTime(issue.lastSeen)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
