import { useEffect, useState } from "react";
import { X, Flag, Check, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { reportQuestion } from "@/lib/reports.functions";

const REASONS = ["Broken question", "Improperly graded", "Unclear wording", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  questionId: string;
  slot: number;
}

export function QuestionReportModal({ open, onClose, questionId, slot }: Props) {
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

  const submit = useServerFn(reportQuestion);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason(null);
      setDetails("");
      setStatus("idle");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setStatus("submitting");
    setError(null);
    try {
      await submit({
        questionId,
        slot,
        reason,
        details: details.trim() || undefined,
      });
      setStatus("sent");
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

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
          background: "var(--lavender)",
          color: "var(--ink)",
          border: "1px solid rgba(74,6,136,0.25)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 size-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(29,41,0,0.08)", color: "var(--ink)" }}
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Flag className="size-5" style={{ color: "var(--violet-deep)" }} />
          <h3 className="display text-xl" style={{ color: "var(--violet-deep)" }}>
            Report question
          </h3>
        </div>
        <p className="text-sm" style={{ color: "rgba(29,41,0,0.7)" }}>
          Let us know what’s wrong with this question.
        </p>

        {status === "sent" ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <div
              className="size-12 rounded-full flex items-center justify-center"
              style={{ background: "var(--volt)" }}
            >
              <Check className="size-6" style={{ color: "var(--ink)" }} />
            </div>
            <p className="font-bold text-base">Thanks for the feedback</p>
            <p className="text-sm" style={{ color: "rgba(29,41,0,0.7)" }}>
              We’ll review this question and fix it if needed.
            </p>
            <button
              onClick={onClose}
              className="btn-volt mt-2 w-full py-3 rounded-2xl text-base font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: selected ? "var(--volt)" : "rgba(29,41,0,0.06)",
                      border: selected
                        ? "1.5px solid var(--volt)"
                        : "1.5px solid rgba(29,41,0,0.12)",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything else we should know? (optional)"
              maxLength={1000}
              className="mt-3 w-full rounded-xl p-3 text-sm resize-none outline-none focus:ring-2"
              style={{
                background: "rgba(29,41,0,0.06)",
                border: "1.5px solid rgba(29,41,0,0.12)",
                color: "var(--ink)",
                minHeight: "96px",
              }}
            />

            {error && (
              <p className="mt-2 text-xs font-medium" style={{ color: "#ff4d6d" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!reason || status === "submitting"}
              className="btn-volt mt-5 w-full py-3 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Flag className="size-4" />
              )}
              Submit report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
