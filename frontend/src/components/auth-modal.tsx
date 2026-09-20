import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "login" | "register";
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useStore();
  const navigate = useNavigate();

  function complete(provider: "github" | "email", address: string) {
    signIn({ email: address, name: address.split("@")[0] ?? "dev", provider });
    onOpenChange(false);
    void navigate({ to: "/dashboard" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-surface p-0 gap-0">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="h-2 w-2 bg-redline" />
            {mode === "login" ? "Sign in to Redline" : "Create your Redline account"}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Access your projects, issues and alerts."
              : "Start capturing exceptions in under five minutes."}
          </p>
        </div>

        <div className="px-6 py-5">
          <button
            type="button"
            onClick={() => complete("github", "octo.dev@github.com")}
            className="flex w-full items-center justify-center gap-2 border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium transition-colors hover:border-redline hover:bg-accent"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="mono-label">or email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              complete("email", email || "dev@redline.io");
            }}
          >
            <div>
              <label className="mono-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 w-full border border-input bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus:border-redline"
              />
            </div>
            <div>
              <label className="mono-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="mt-1.5 w-full border border-input bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus:border-redline"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-redline px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-foreground underline underline-offset-4 hover:text-redline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
