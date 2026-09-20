import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell, Sparkline, StatusPill } from "@/components/app-shell";
import { relativeTime, type Environment, type IssueStatus, type Level } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/projects/$projectId/")({
  head: () => ({
    meta: [
      { title: "Project issues — Redline" },
      {
        name: "description",
        content: "Browse grouped errors for a Redline project, filtered by status, environment and level.",
      },
      { property: "og:title", content: "Project issues — Redline" },
      {
        property: "og:description",
        content: "Grouped errors for a Redline project with status, environment and level filters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectIssuesPage,
});

const statuses: (IssueStatus | "all")[] = ["all", "open", "resolved", "ignored"];
const envs: (Environment | "all")[] = ["all", "production", "staging", "development"];
const levels: (Level | "all")[] = ["all", "error", "warning", "info"];

function Filter<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="mono-label" htmlFor={`f-${label}`}>
        {label}
      </label>
      <select
        id={`f-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1.5 border border-input bg-background px-3 py-1.5 font-mono text-xs outline-none focus:border-redline"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProjectIssuesPage() {
  const { projectId } = Route.useParams();
  const { projects, issues } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [environment, setEnvironment] = useState<Environment | "all">("all");
  const [level, setLevel] = useState<Level | "all">("all");

  const rows = useMemo(
    () =>
      issues
        .filter((i) => i.projectId === projectId)
        .filter((i) => status === "all" || i.status === status)
        .filter((i) => environment === "all" || i.environment === environment)
        .filter((i) => level === "all" || i.level === level)
        .sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen)),
    [issues, projectId, status, environment, level],
  );

  if (!project) {
    return (
      <AppShell breadcrumb={<span className="mono-label">unknown project</span>}>
        <p className="text-sm text-muted-foreground">This project no longer exists.</p>
        <Link to="/projects" className="mt-4 inline-block text-sm text-redline">
          Back to projects
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumb={
        <span className="mono-label">
          projects / <span className="text-foreground">{project.name}</span>
        </span>
      }
    >
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} issue{rows.length === 1 ? "" : "s"} · {project.platform}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Filter label="status" value={status} options={statuses} onChange={setStatus} />
          <Filter label="environment" value={environment} options={envs} onChange={setEnvironment} />
          <Filter label="level" value={level} options={levels} onChange={setLevel} />
        </div>
      </div>

      <div className="mt-6 border border-border bg-surface">
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No issues match these filters.
          </p>
        )}
        {rows.map((issue) => (
          <Link
            key={issue.id}
            to="/projects/$projectId/issues/$issueId"
            params={{ projectId, issueId: issue.id }}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-accent/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-mono text-sm font-semibold">{issue.title}</span>
                <StatusPill status={issue.level} />
                <StatusPill status={issue.status} />
              </div>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {issue.culprit} · {issue.environment} · last seen {relativeTime(issue.lastSeen)}
              </p>
            </div>
            <Sparkline data={issue.sparkline} />
            <div className="w-20 text-right">
              <p className="font-mono text-lg">{issue.totalOccurrences.toLocaleString()}</p>
              <p className="mono-label">events</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
