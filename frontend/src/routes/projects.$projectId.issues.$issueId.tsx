import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Sparkline, StatusPill } from "@/components/app-shell";
import { eventsForIssue, relativeTime, type IssueStatus } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/projects/$projectId/issues/$issueId")({
  head: () => ({
    meta: [
      { title: "Issue detail — Redline" },
      {
        name: "description",
        content: "Inspect a grouped error: stack trace, recent events, metadata and fingerprint.",
      },
      { property: "og:title", content: "Issue detail — Redline" },
      {
        property: "og:description",
        content: "Stack trace, recent events, metadata and fingerprint for a grouped error.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IssueDetailPage,
});

const statusActions: IssueStatus[] = ["open", "resolved", "ignored"];

function IssueDetailPage() {
  const { projectId, issueId } = Route.useParams();
  const { issues, projects, setIssueStatus } = useStore();
  const issue = issues.find((i) => i.id === issueId);
  const project = projects.find((p) => p.id === projectId);
  const events = useMemo(() => (issue ? eventsForIssue(issue) : []), [issue]);
  const [selected, setSelected] = useState(0);

  if (!issue || !project) {
    return (
      <AppShell breadcrumb={<span className="mono-label">unknown issue</span>}>
        <p className="text-sm text-muted-foreground">This issue no longer exists.</p>
        <Link to="/projects" className="mt-4 inline-block text-sm text-redline">
          Back to projects
        </Link>
      </AppShell>
    );
  }

  const event = events[selected] ?? events[0]!;

  return (
    <AppShell
      breadcrumb={
        <span className="mono-label">
          projects / {project.name} / <span className="text-foreground">issue</span>
        </span>
      }
    >
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {project.name} issues
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={issue.level} />
            <StatusPill status={issue.status} />
            <span className="mono-label">{issue.environment}</span>
          </div>
          <h1 className="mt-2 font-mono text-xl font-semibold tracking-tight">{issue.title}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{issue.culprit}</p>
        </div>
        <div className="flex gap-2">
          {statusActions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={issue.status === s}
              onClick={() => {
                setIssueStatus(issue.id, s);
                toast.success(`Issue marked ${s}`);
              }}
              className="border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors hover:border-redline disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "events", value: issue.totalOccurrences.toLocaleString() },
          { label: "first seen", value: relativeTime(issue.firstSeen) },
          { label: "last seen", value: relativeTime(issue.lastSeen) },
          { label: "fingerprint", value: issue.fingerprint },
        ].map((s) => (
          <div key={s.label} className="border border-border bg-surface px-4 py-3">
            <p className="mono-label">{s.label}</p>
            <p className="mt-1 truncate font-mono text-base">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border border-border bg-surface px-5 py-4">
        <p className="mono-label">events over the last 12 hours</p>
        <div className="mt-2">
          <Sparkline data={issue.sparkline} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="border border-border bg-surface">
          <p className="border-b border-border px-4 py-3 mono-label">last 10 events</p>
          <div className="max-h-[420px] overflow-auto">
            {events.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelected(i)}
                className={`block w-full border-b border-border px-4 py-2.5 text-left last:border-b-0 hover:bg-accent/40 ${
                  i === selected ? "bg-accent/60" : ""
                }`}
              >
                <p className="font-mono text-xs">{relativeTime(e.timestamp)}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {e.metadata["url"]}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="border border-border bg-surface">
            <p className="border-b border-border px-4 py-3 mono-label">stack trace</p>
            <div className="divide-y divide-border">
              {event.stackTrace.map((f, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="font-mono text-xs">
                    <span className="text-redline">{f.filename}</span>
                    <span className="text-muted-foreground"> in {f.function}</span>
                    <span className="text-muted-foreground"> line {f.lineno}</span>
                  </p>
                  <pre className="mt-1.5 overflow-x-auto border border-border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {f.context}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-surface">
            <p className="border-b border-border px-4 py-3 mono-label">metadata</p>
            <dl className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-2">
              {Object.entries(event.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                  <dt className="font-mono text-xs text-muted-foreground">{k}</dt>
                  <dd className="truncate font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
