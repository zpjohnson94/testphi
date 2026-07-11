import { Link, useLocation } from "@tanstack/react-router";
import { Home, Grid3x3, User2 } from "lucide-react";

export function FreeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <FreeBottomNav />
    </div>
  );
}

function FreeBottomNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/home", label: "Home", Icon: Home },
    { to: "/domains", label: "Domains", Icon: Grid3x3 },
    { to: "/account", label: "Account", Icon: User2 },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 backdrop-blur"
      style={{ background: "rgba(29,41,0,0.92)", borderTop: "1px solid rgba(246,240,250,0.1)" }}
    >
      <div className="mx-auto max-w-2xl grid grid-cols-3">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to as any}
              className="flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors"
              style={{ color: active ? "var(--volt)" : "rgba(246,240,250,0.55)" }}
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
