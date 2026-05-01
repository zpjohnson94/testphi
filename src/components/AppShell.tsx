import { Link, useLocation } from "@tanstack/react-router";
import { Home, BookOpen, Calculator, User2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      {children}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/dashboard", label: "Home", Icon: Home },
    { to: "/learn/reading-writing", label: "R&W", Icon: BookOpen },
    { to: "/learn/math", label: "Math", Icon: Calculator },
    { to: "/profile", label: "You", Icon: User2 },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors"
              style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
