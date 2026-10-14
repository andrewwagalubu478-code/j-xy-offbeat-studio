/**
 * Shared application shell.
 *
 * Header status bar (wordmark + mono readouts), a main content area, and the
 * attribution footer. The transport bar is rendered by the studio page so it
 * can sit sticky above the footer.
 */

import { cn } from "@/lib/utils";
import { useStudioStore } from "@/store/studio";
import { Link, useRouterState } from "@tanstack/react-router";

interface LayoutProps {
  children: React.ReactNode;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function Layout({ children }: LayoutProps) {
  const bpm = useStudioStore((s) => s.composition.settings.bpm);
  const bars = useStudioStore((s) => s.composition.settings.bars);
  const transport = useStudioStore((s) => s.transport);
  const currentStep = useStudioStore((s) => s.currentStep);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const stepDuration = 60 / bpm / 4;
  const elapsed = currentStep >= 0 ? currentStep * stepDuration : 0;

  const navItems = [
    { to: "/", label: "Studio" },
    { to: "/library", label: "Library" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-subtle">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            data-ocid="header.link"
            aria-label="PulseGrid home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-display text-lg font-bold leading-none">
                P
              </span>
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              PULSEGRID
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={`nav.${item.label.toLowerCase()}.link`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-smooth",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4 font-mono text-xs tabular-nums">
            <div className="flex flex-col items-end leading-tight">
              <span className="label-caps text-[10px]">Status</span>
              <span
                className={cn(
                  "capitalize",
                  transport === "playing"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                data-ocid="header.status"
              >
                {transport}
              </span>
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="label-caps text-[10px]">BPM</span>
              <span className="text-foreground" data-ocid="header.bpm">
                {bpm}
              </span>
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="label-caps text-[10px]">Bars</span>
              <span className="text-foreground" data-ocid="header.bars">
                {bars}
              </span>
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="label-caps text-[10px]">Time</span>
              <span className="text-foreground" data-ocid="header.time">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row md:px-6">
          <span className="font-mono">
            PulseGrid — offline generative studio
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-foreground"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
