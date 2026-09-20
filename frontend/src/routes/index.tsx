import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Fingerprint, Github, Terminal, Zap } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Redline — Error Monitoring for Django & JavaScript Apps" },
      {
        name: "description",
        content:
          "Redline captures exceptions, fingerprints them into issues and alerts your team before users complain.",
      },
      { property: "og:title", content: "Redline — Error Monitoring Platform" },
      {
        property: "og:description",
        content:
          "Ingest exceptions, group them by fingerprint, track issues and get alerted on error bursts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Zap,
    title: "Async ingestion",
    body: "POST /api/ingest returns 202 immediately. Payloads are queued to Celery, never processed in the request cycle.",
  },
  {
    icon: Fingerprint,
    title: "Fingerprint grouping",
    body: "Stack frames are normalized and hashed, so the same crash from a thousand requests collapses into one issue.",
  },
  {
    icon: Activity,
    title: "Threshold alerts",
    body: "A beat task counts events per issue per window and emails you the moment a burst crosses your threshold.",
  },
];

function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  function open(next: "login" | "register") {
    setMode(next);
    setAuthOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-5 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 bg-redline" />
          <span className="font-mono text-sm font-bold tracking-[0.2em]">REDLINE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => open("login")}
            className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => open("register")}
            className="bg-redline px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get access
          </button>
        </div>
      </header>

      <section className="grid-backdrop border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-24 lg:px-10">
          <p className="mono-label">error monitoring · django + celery + postgres</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Every exception in your stack,{" "}
            <span className="text-redline">grouped, counted and on the record.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Drop the SDK into your app, point it at a project API key, and Redline turns raw
            tracebacks into deduplicated issues with occurrence counts, environments and alert
            rules.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => open("register")}
              className="flex items-center gap-2 bg-redline px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Github className="h-4 w-4" /> Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => open("login")}
              className="border border-border px-5 py-3 text-sm font-medium transition-colors hover:border-redline"
            >
              Sign in with email
            </button>
          </div>

          <div className="mt-16 max-w-2xl border border-border bg-surface redline-glow">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <Terminal className="h-3.5 w-3.5 text-redline" />
              <span className="mono-label">capture.py</span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-muted-foreground">
              <code>{`from redline_sdk import capture_exception

try:
    total = subtotal / discount_divisor
except Exception as exc:
    capture_exception(exc, environment="production")
# -> 202 Accepted  ·  queued as event, grouped by fingerprint`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-10">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-6">
              <Icon className="h-5 w-5 text-redline" />
              <h2 className="mt-4 text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-5 py-6 lg:px-10">
        <p className="font-mono text-xs text-muted-foreground">
          REDLINE · built with Django, DRF, Celery, Redis and Postgres
        </p>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={mode} />
    </div>
  );
}
