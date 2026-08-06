import { X, Check } from "lucide-react";
import { useEffect } from "react";
import { DOMAIN_CONTENT } from "@/lib/domainContent";
import { domainById } from "@/lib/freeUser";

interface Props {
  open: boolean;
  domainId: string | null;
  onClose: () => void;
}

export function DomainInfoModal({ open, domainId, onClose }: Props) {
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

  if (!open || !domainId) return null;
  const domain = domainById(domainId);
  const content = DOMAIN_CONTENT[domainId];
  if (!domain || !content) return null;

  const parts = domain.label.split(" · ");
  const section = parts[0];
  const name = parts.slice(1).join(" · ");
  const isMath = domain.section === "math";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 py-6 animate-fade-up"
      style={{ background: "rgba(10,5,26,0.94)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl p-6"
        style={{
          background: "var(--violet-deep)",
          border: "1.5px solid rgba(168,85,247,0.5)",
          color: "var(--lavender)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 size-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}
        >
          <X className="size-4" />
        </button>

        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: isMath ? "var(--neon)" : "var(--volt)",
            color: isMath ? "var(--lavender)" : "var(--ink)",
          }}
        >
          {section}
        </span>

        <h3 className="display text-2xl mt-2 pr-8">{name}</h3>

        <p className="mt-3 text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
          {content.description}
        </p>

        <div
          className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--volt)" }}
        >
          What you'll see
        </div>
        <p className="mt-1.5 text-sm font-medium" style={{ color: "rgba(246,240,250,0.75)" }}>
          {content.questionTypes}
        </p>

        <div
          className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--volt)" }}
        >
          Tips
        </div>
        <ul className="mt-2 space-y-2.5">
          {content.tips.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-sm font-medium">
              <Check className="size-4 mt-0.5 shrink-0" style={{ color: "var(--volt)" }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
