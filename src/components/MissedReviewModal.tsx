import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check, HelpCircle } from "lucide-react";
import { useServeDailyQuestion } from "@/lib/useFree";
import { PowerUpModal } from "./PowerUpModal";

export interface MissedQuestionRef {
  slot: number;
  domainLabel?: string;
}

interface Props {
  open: boolean;
  missed: MissedQuestionRef[];
  onClose: () => void;
}

export function MissedReviewModal({ open, missed, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [showPowerUp, setShowPowerUp] = useState(false);
  if (!open || missed.length === 0) return null;
  const current = missed[Math.min(idx, missed.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-5"
        style={{
          background: "var(--violet-deep)",
          border: "1.5px solid rgba(168,85,247,0.5)",
          color: "var(--lavender)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--volt)" }}>
            Review · {idx + 1} of {missed.length}
          </div>
          <button
            onClick={onClose}
            aria-label="Close review"
            className="size-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(246,240,250,0.18)" }}
          >
            <X className="size-4" />
          </button>
        </div>

        <QuestionReview slot={current.slot} />

        {missed.length > 1 && (
          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              disabled={idx === 0}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: "rgba(246,240,250,0.08)", border: "1px solid rgba(246,240,250,0.2)" }}
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <button
              disabled={idx >= missed.length - 1}
              onClick={() => setIdx((i) => Math.min(missed.length - 1, i + 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: "rgba(246,240,250,0.08)", border: "1px solid rgba(246,240,250,0.2)" }}
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionReview({ slot }: { slot: number }) {
  const { data, isLoading, error } = useServeDailyQuestion(slot);

  if (isLoading) {
    return <div className="text-sm opacity-70">Loading question…</div>;
  }
  if (error || !data) {
    return <div className="text-sm text-[var(--destructive)]">Couldn't load question.</div>;
  }

  const correctPos = data.correctPosition ?? -1;
  const selectedPos = data.selectedPosition ?? -1;

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(246,240,250,0.6)" }}>
        {data.domainLabel}
      </div>
      {data.passage && (
        <div className="text-sm mb-3 whitespace-pre-wrap opacity-90">{data.passage}</div>
      )}
      <div className="text-base font-medium mb-4 whitespace-pre-wrap">{data.question}</div>
      <div className="space-y-2">
        {data.choices.map((c, i) => {
          const isCorrect = i === correctPos;
          const isSelected = i === selectedPos;
          const bg = isCorrect
            ? "rgba(184,255,0,0.15)"
            : isSelected
              ? "rgba(255,77,109,0.15)"
              : "rgba(246,240,250,0.05)";
          const border = isCorrect
            ? "1.5px solid var(--volt)"
            : isSelected
              ? "1.5px solid var(--destructive)"
              : "1px solid rgba(246,240,250,0.12)";
          return (
            <div
              key={i}
              className="rounded-xl p-3 text-sm flex items-start gap-2"
              style={{ background: bg, border }}
            >
              <div className="flex-1 whitespace-pre-wrap">{c}</div>
              {isCorrect && <Check className="size-4 shrink-0" style={{ color: "var(--volt)" }} />}
              {isSelected && !isCorrect && <X className="size-4 shrink-0" style={{ color: "var(--destructive)" }} />}
            </div>
          );
        })}
      </div>
      {selectedPos >= 0 && (
        <div className="mt-3 text-xs" style={{ color: "rgba(246,240,250,0.65)" }}>
          {selectedPos === correctPos ? "You answered correctly." : "Your answer is marked in red; the correct answer is highlighted in green."}
        </div>
      )}
    </div>
  );
}
