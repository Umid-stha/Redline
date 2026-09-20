import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, FolderKanban, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

const nav = [
  { to: "/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
] as const;

export function AppShell({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb?: ReactNode;
}) {
  const { user, signOut } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) void navigate({ to: "/" });
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="h-3 w-3 bg-redline" />
          <span className="font-mono text-sm font-bold tracking-[0.2em]">REDLINE</span>
        </Link>
        <nav className="flex-1 p-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-accent text-foreground border-l-redline" }}
              className="mb-1 flex items-center gap-2.5 border-l-2 border-l-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="px-2 pb-2">
            <p className="truncate text-sm">{user?.name ?? "—"}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              void navigate({ to: "/" });
            }}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-redline"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-5">
          <Link to="/dashboard" className="font-mono text-sm font-bold tracking-[0.2em] md:hidden">
            REDLINE
          </Link>
          {breadcrumb}
        </header>
        <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    open: "border-redline/50 text-redline",
    resolved: "border-ok/50 text-ok",
    ignored: "border-border text-muted-foreground",
    error: "border-redline/50 text-redline",
    warning: "border-warn/50 text-warn",
    info: "border-info/50 text-info",
  };
  return (
    <span
      className={`border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${tone[status] ?? "border-border text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-7 items-end gap-[2px]">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-[3px] bg-redline/70"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
