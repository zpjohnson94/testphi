import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { updateSignup } from "@/lib/signups.functions";

/**
 * Alpha: Power Up isn't purchasable (no drill flow, no payments), so this modal
 * behaves as a waitlist signup. Flip WAITLIST_MODE to false once drills +
 * payments ship to restore the purchase copy/CTA below.
 */
const WAITLIST_MODE = true;

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function PowerUpModal({
  open,
  onClose,
  title = WAITLIST_MODE
    ? "Power Up isn't ready yet!"
    : "Power Up for answer explanations",
}: Props) {
  const updateSignupFn = useServerFn(updateSignup);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function captureWaitlistIntent() {
    try {
      const email =
        typeof window !== "undefined" ? window.localStorage.getItem("signup_email") : null;
      if (email) {
        void updateSignupFn({
          data: { email, plan: "power_up", notify_opt_in: true },
        }).catch(() => {});
      }
    } catch {}
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 py-6 animate-fade-up"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-7"
        style={{
          background: "rgba(74,6,136,0.92)",
          border: "2px solid var(--volt)",
          boxShadow: "0 0 60px -10px rgba(184,255,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 size-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}
        >
          <X className="size-4" />
        </button>

        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(74,6,136,0.85)", color: "var(--lavender)", border: "1px solid rgba(168,85,247,0.4)" }}
        >
          {WAITLIST_MODE ? "COMING SOON" : "Recommended"}
        </div>

        <h3 className="display text-2xl text-[var(--lavender)] mt-1 pr-8">{title}</h3>

        {WAITLIST_MODE ? (
          <p className="mt-3 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
            Join the waitlist and we'll email you at launch with a little gift for being an early
            believer.
          </p>
        ) : (
          <>
            <div className="mt-3">
              <div className="score-num text-3xl text-[var(--lavender)]">
                $12 <span className="text-base font-semibold opacity-70">/ mo</span>
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "rgba(246,240,250,0.6)" }}>
                billed annually
              </div>
            </div>
            <div className="mt-2 text-xs font-medium italic" style={{ color: "rgba(246,240,250,0.55)" }}>
              Less than half the cost of other test prep apps
            </div>
          </>
        )}

        <ul className="mt-5 space-y-2.5">
          <Feat>Detailed answer explanations</Feat>
          <Feat>Weak spot detection</Feat>
          <Feat>Adaptive training targeting weak spots</Feat>
          <Feat>Unlimited practice questions</Feat>
          <Feat>Specific training across all 8 SAT domains</Feat>
        </ul>

        <Link
          to={"/coming-soon?plan=powerup" as any}
          onClick={captureWaitlistIntent}
          className="btn-volt block text-center mt-6 py-3.5 text-base rounded-2xl"
        >
          {WAITLIST_MODE ? "Join the Power Up waitlist →" : "Get Power Up →"}
        </Link>
        <button
          onClick={onClose}
          className="block w-full text-center mt-3 text-sm font-bold"
          style={{ color: "rgba(246,240,250,0.55)" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="flex items-start gap-2.5 text-sm font-medium"
      style={{ color: "var(--lavender)" }}
    >
      <Check className="size-4 mt-0.5 shrink-0" style={{ color: "var(--volt)" }} />
      <span>{children}</span>
    </li>
  );
}
