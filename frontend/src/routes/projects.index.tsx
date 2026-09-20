import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { relativeTime } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects & API Keys — Redline" },
      {
        name: "description",
        content: "Create Redline projects, rotate ingest API keys and jump into each project's issue stream.",
      },
      { property: "og:title", content: "Projects & API Keys — Redline" },
      {
        property: "og:description",
        content: "Create projects, manage ingest API keys and open each project's issues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ApiKeyRow({ apiKey }: { apiKey: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2 border border-border bg-background px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
        {shown ? apiKey : `${apiKey.slice(0, 7)}${"•".repeat(24)}`}
      </code>
      <button
        type="button"
        aria-label={shown ? "Hide API key" : "Reveal API key"}
        onClick={() => setShown(!shown)}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        aria-label="Copy API key"
        onClick={() => {
          void navigator.clipboard?.writeText(apiKey);
          setCopied(true);
          toast.success("API key copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function ProjectsPage() {
  const { projects, issues, createProject, rotateKey, deleteProject } = useStore();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("python / django");
  const [creating, setCreating] = useState(false);

  return (
    <AppShell breadcrumb={<span className="mono-label">projects</span>}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each project has its own ingest key. Send it as the <code className="font-mono">X-API-Key</code> header.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="flex items-center gap-2 bg-redline px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {creating && (
        <form
          className="mt-6 flex flex-wrap items-end gap-3 border border-border bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createProject(name.trim(), platform);
            toast.success(`Project "${name.trim()}" created with a fresh API key`);
            setName("");
            setCreating(false);
          }}
        >
          <div className="min-w-48 flex-1">
            <label className="mono-label" htmlFor="project-name">
              Project name
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="payments-service"
              className="mt-1.5 w-full border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-redline"
            />
          </div>
          <div className="min-w-48 flex-1">
            <label className="mono-label" htmlFor="project-platform">
              Platform
            </label>
            <select
              id="project-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1.5 w-full border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-redline"
            >
              <option>python / django</option>
              <option>python / celery</option>
              <option>javascript / react</option>
              <option>node / express</option>
            </select>
          </div>
          <button
            type="submit"
            className="border border-redline px-4 py-2 text-sm font-semibold text-redline transition-colors hover:bg-redline hover:text-primary-foreground"
          >
            Create
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {projects.map((project) => {
          const projectIssues = issues.filter((i) => i.projectId === project.id);
          const openCount = projectIssues.filter((i) => i.status === "open").length;
          return (
            <div key={project.id} className="border border-border bg-surface">
              <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="truncate font-mono text-base font-semibold hover:text-redline"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.platform} · created {relativeTime(project.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => {
                    deleteProject(project.id);
                    toast.success(`Deleted ${project.name}`);
                  }}
                  className="text-muted-foreground transition-colors hover:text-redline"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="mono-label">ingest api key</span>
                  <button
                    type="button"
                    onClick={() => {
                      rotateKey(project.id);
                      toast.success("New API key generated — the old key stops working");
                    }}
                    className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-redline"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
                <div className="mt-2">
                  <ApiKeyRow apiKey={project.apiKey} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="mono-label">open</p>
                      <p className="font-mono text-lg">{openCount}</p>
                    </div>
                    <div>
                      <p className="mono-label">events</p>
                      <p className="font-mono text-lg">
                        {projectIssues
                          .reduce((s, i) => s + i.totalOccurrences, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="border border-border px-3 py-1.5 text-sm transition-colors hover:border-redline"
                  >
                    View issues
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
