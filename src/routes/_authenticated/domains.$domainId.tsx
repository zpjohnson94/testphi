import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Info } from "lucide-react";

import { FreeShell } from "@/components/FreeShell";
import { Logo } from "@/components/Logo";
import { PowerUpModal } from "@/components/PowerUpModal";
import { UnlockReadyCard } from "@/components/UnlockReadyCard";
import { BonusUnlockModal } from "@/components/BonusUnlockModal";
import { DomainInfoModal } from "@/components/DomainInfoModal";
import { PersonalizedRecommendationsCard } from "@/components/PersonalizedRecommendationsCard";
import { MissedReviewModal } from "@/components/MissedReviewModal";
import { useFreeState } from "@/lib/useFree";
import { DOMAINS, SCORING, domainById, tierColor, tierOf } from "@/lib/freeUser";
import { getDomainActivity, getDomainMissedReviews } from "@/lib/domainDetail.functions";

export const Route = createFileRoute("/_authenticated/domains/$domainId")({
  head: () => ({
    meta: [
      { title: "Domain detail — TestPhi" },
      {
        name: "description",
        content:
          "See your mastery, recent activity, and missed questions for a single SAT domain on TestPhi.",
      },
      { property: "og:title", content: "Domain detail — TestPhi" },
      {
        property: "og:description",
        content: "Track mastery and review missed questions domain by domain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DomainDetail,
});

function DomainPill({ section }: { section: string }) {
  const isMath = section === "Math";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: isMath ? "var(--neon)" : "var(--volt)",
        color: isMath ? "var(--lavender)" : "var(--ink)",
      }}
    >
      {section}
    </span>
  );
}

const DIFF_LABEL: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function DomainDetail() {
  const { domainId } = Route.useParams();
  const { data: state } = useFreeState();
  const [showPowerUp, setShowPowerUp] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const activityFn = useServerFn(getDomainActivity);
  const reviewsFn = useServerFn(getDomainMissedReviews);

  const { data: activity } = useQuery({
    queryKey: ["domain-activity", domainId],
    queryFn: () => activityFn({ data: { domainId } }),
  });

  const { data: reviews } = useQuery({
    queryKey: ["domain-missed", domainId],
    queryFn: () => reviewsFn({ data: { domainId } }),
    enabled: reviewOpen,
  });

  const domain = useMemo(() => DOMAINS.find((d) => d.id === domainId), [domainId]);
  const stat = state?.domainStats[domainId];
  const mastery = stat?.mastery ?? 0;
  const initialized = stat?.initialized ?? false;
  const answered = stat?.answered ?? 0;
  const bonusReady = !!stat && !stat.initialized && answered >= SCORING.THRESHOLD_QUESTIONS;
  const color = tierColor(tierOf(mastery, initialized));

  const parts = (domain?.label ?? "").split(" · ");
  const section = parts[0] ?? "";
  const name = parts.slice(1).join(" · ");

  return (
    <FreeShell>
      <div className="topo-bg min-h-screen">
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}
        >
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-2">
            <Link
              to="/domains"
              aria-label="Back to domains"
              className="size-8 -ml-1 rounded-full flex items-center justify-center"
              style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Logo size={28} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-12 space-y-8">
          {/* Hero */}
          <section>
            <DomainPill section={section} />
            <div className="mt-2 flex items-start gap-2">
              <h1 className="display text-3xl text-[var(--lavender)]">{name || "Domain"}</h1>
              <button
                onClick={() => setShowInfo(true)}
                aria-label="About this domain"
                className="mt-1 size-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}
              >
                <Info className="size-4" />
              </button>
            </div>

            {bonusReady ? (
              <div className="mt-5">
                <UnlockReadyCard domainName={name} onOpen={() => setShowBonus(true)} />
              </div>
            ) : initialized ? (
              <div className="mt-5">
                <div className="score-num text-5xl tabular-nums" style={{ color }}>
                  {Math.round(mastery)}%
                </div>
                <div
                  className="mt-3 h-3 rounded-full overflow-hidden"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid color-mix(in srgb, ${color}, transparent 75%)`,
                  }}
                >
                  <div
                    className="mastery-swirl-fill h-full rounded-full transition-all duration-700"
                    style={{ width: `${mastery}%`, ["--swirl-color" as any]: color }}
                  />
                </div>
                {/* TODO: 7-day mastery delta isn't queryable yet — no per-day
                    mastery snapshot exists in the schema. Wire this up once
                    mastery history is persisted. */}
                <div className="mt-2 text-xs font-bold" style={{ color }}>
                  Mastery trend over the last 7 days coming soon
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex gap-1.5">
                  {Array.from({ length: SCORING.THRESHOLD_QUESTIONS }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-2 rounded-full"
                      style={{
                        background: i < answered ? "var(--volt)" : "rgba(246,240,250,0.12)",
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
                  Answer 5 questions in this domain to unlock your Bonus Round.
                </div>
              </div>
            )}
          </section>

          {/* Activity */}
          <section>
            <h2 className="display text-2xl text-[var(--lavender)]">Activity</h2>
            {activity && activity.rows.length === 0 ? (
              <p className="mt-3 text-sm font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
                No questions answered in this domain yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {(activity?.rows ?? []).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background: "var(--violet-deep)",
                      border: "1.5px solid rgba(168,85,247,0.35)",
                    }}
                  >
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: r.correct ? "var(--volt)" : "var(--destructive)",
                        color: r.correct ? "var(--ink)" : "var(--lavender)",
                        boxShadow: r.correct
                          ? "0 0 12px rgba(184,255,0,0.6)"
                          : "0 0 12px rgba(255,77,109,0.6)",
                      }}
                    >
                      {r.correct ? "✓" : "✕"}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        color: "rgba(246,240,250,0.8)",
                      }}
                    >
                      {DIFF_LABEL[r.difficulty] ?? "Medium"}
                    </span>
                    <span
                      className="ml-auto text-xs font-medium"
                      style={{ color: "rgba(246,240,250,0.6)" }}
                    >
                      {relativeTime(r.answeredAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!!activity?.missedCount && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-bold" style={{ color: "var(--lavender)" }}>
                  {activity.missedCount} question{activity.missedCount === 1 ? "" : "s"} missed in
                  this domain
                </span>
                <button
                  onClick={() => setReviewOpen(true)}
                  className="text-sm font-bold"
                  style={{ color: "var(--volt)" }}
                >
                  Review →
                </button>
              </div>
            )}
          </section>

          {/* Personalized recommendations (locked) */}
          <PersonalizedRecommendationsCard
            tierColor={color}
            onUnlock={() => setShowPowerUp(true)}
          />

          {/* Drill CTA */}
          <button
            onClick={() => setShowPowerUp(true)}
            className="w-full py-3 text-sm font-bold text-center rounded-2xl"
            style={{
              background: "var(--volt)",
              color: "var(--ink)",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            Drill this domain
          </button>
        </main>
      </div>

      <DomainInfoModal open={showInfo} domainId={domainId} onClose={() => setShowInfo(false)} />

      <PowerUpModal
        open={showPowerUp}
        onClose={() => setShowPowerUp(false)}
        title="Power Up for personalized recommendations"
      />

      <BonusUnlockModal
        open={showBonus}
        domainId={showBonus ? domainId : null}
        domainLabel={domainById(domainId)?.label ?? ""}
        onClose={() => setShowBonus(false)}
      />

      <MissedReviewModal
        open={reviewOpen}
        items={reviews ?? []}
        onClose={() => setReviewOpen(false)}
      />
    </FreeShell>
  );
}
