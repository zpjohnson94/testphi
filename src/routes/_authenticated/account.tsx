import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Pencil, Check, X } from "lucide-react";
import { FreeShell } from "@/components/FreeShell";
import { Avatar, ANIMALS, COLOR_SWATCHES, ACCESSORIES, type AvatarConfig, type AnimalId, type AccessoryId } from "@/components/Avatar";
import { loadFree, saveFree, type FreeState } from "@/lib/freeUser";
import { useHydration, useStore, updateAvatar } from "@/lib/store";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — TestPhi" }] }),
  component: AccountPage,
});

function AccountPage() {
  useHydration();
  const storeAvatar = useStore((s) => s.avatar);
  const unlocked = useStore((s) => s.unlockedAccessories);

  const [free, setFree] = useState<FreeState | null>(() =>
    typeof window === "undefined" ? null : loadFree(),
  );
  useEffect(() => { if (!free) setFree(loadFree()); }, []);

  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarConfig>(storeAvatar);

  if (!free) {
    return <FreeShell><div className="mx-auto max-w-2xl p-5" /></FreeShell>;
  }

  const persist = (patch: Partial<FreeState>) => {
    const next = { ...free, ...patch };
    setFree(next);
    saveFree(next);
  };

  const startName = () => { setNameDraft(free.name); setEditingName(true); };
  const saveName = () => { persist({ name: nameDraft.trim() }); setEditingName(false); };
  const startEmail = () => { setEmailDraft(free.email); setEditingEmail(true); };
  const saveEmail = () => { persist({ email: emailDraft.trim() }); setEditingEmail(false); };

  const startAvatar = () => { setAvatarDraft(storeAvatar); setEditingAvatar(true); };
  const saveAvatar = () => { updateAvatar(avatarDraft); setEditingAvatar(false); sfx.levelUp(); };

  const isPower = free.plan === "powerup";

  return (
    <FreeShell>
      <div className="topo-bg topo-dim min-h-screen">
        <div className="mx-auto max-w-2xl p-5 space-y-4">
          <h1 className="display text-2xl text-[var(--lavender)]">Account</h1>

          {/* Identity card */}
          <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: "var(--violet-deep)", border: "1.5px solid rgba(168,85,247,0.4)" }}>
            <button onClick={startAvatar} className="size-20 rounded-2xl flex items-center justify-center transition-transform hover:scale-105" style={{ background: "rgba(184,255,0,0.12)", border: "2px solid var(--volt)" }}>
              <Avatar config={storeAvatar} size={64} animate />
            </button>
            <div className="flex-1 min-w-0">
              <div className="display text-xl text-[var(--lavender)] truncate">{free.name || "Your name"}</div>
              <div className="text-xs font-bold" style={{ color: "var(--volt)" }}>{isPower ? "Power Up member" : "Free plan"}</div>
            </div>
          </div>

          {/* Name */}
          <FieldRow
            label="Name"
            value={free.name}
            placeholder="Add your name"
            editing={editingName}
            draft={nameDraft}
            setDraft={setNameDraft}
            onStart={startName}
            onSave={saveName}
            onCancel={() => setEditingName(false)}
          />

          {/* Email */}
          <FieldRow
            label="Email"
            value={free.email}
            placeholder="you@example.com"
            type="email"
            editing={editingEmail}
            draft={emailDraft}
            setDraft={setEmailDraft}
            onStart={startEmail}
            onSave={saveEmail}
            onCancel={() => setEditingEmail(false)}
          />

          {/* Plan */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(246,240,250,0.05)", border: "1px solid rgba(246,240,250,0.1)" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(246,240,250,0.5)" }}>Plan</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: isPower ? "rgba(184,255,0,0.15)" : "rgba(168,85,247,0.18)",
                    color: isPower ? "var(--volt)" : "var(--lavender)",
                    border: `1px solid ${isPower ? "rgba(184,255,0,0.4)" : "rgba(168,85,247,0.45)"}`,
                  }}
                >
                  {isPower ? "Power Up" : "Free"}
                </span>
              </div>
              {!isPower && (
                <Link
                  to={"/coming-soon?plan=powerup" as any}
                  className="btn-volt px-4 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Zap className="size-4" /> Upgrade
                </Link>
              )}
            </div>
          </div>

          {/* Avatar editor */}
          {editingAvatar && (
            <div className="rounded-3xl p-5 animate-pop" style={{ background: "var(--lavender)", color: "var(--ink)" }}>
              <div className="flex items-center justify-between">
                <h3 className="display text-lg">Customize avatar</h3>
                <button onClick={() => setEditingAvatar(false)} className="text-xs font-bold uppercase" style={{ color: "#5a4a72" }}>Cancel</button>
              </div>
              <div className="mt-3 flex justify-center"><Avatar config={avatarDraft} size={112} animate /></div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Animal</div>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {ANIMALS.map((a) => (
                  <button key={a.id} onClick={() => setAvatarDraft({ ...avatarDraft, animal: a.id as AnimalId })} className="aspect-square rounded-2xl flex items-center justify-center" style={{
                    background: avatarDraft.animal === a.id ? "var(--violet-deep)" : "rgba(74,6,136,0.06)",
                    border: avatarDraft.animal === a.id ? "2px solid var(--neon)" : "2px solid transparent",
                  }}>
                    <Avatar config={{ ...avatarDraft, animal: a.id as AnimalId, accessory: "none" }} size={32} />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Color</div>
              <div className="mt-2 grid grid-cols-10 gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button key={c} onClick={() => setAvatarDraft({ ...avatarDraft, color: c })} className="aspect-square rounded-full" style={{
                    background: c,
                    border: avatarDraft.color === c ? "3px solid var(--ink)" : "2px solid rgba(0,0,0,0.15)",
                    boxShadow: avatarDraft.color === c ? "0 0 0 2px var(--neon)" : "none",
                  }} />
                ))}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Accessories</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {ACCESSORIES.map((a) => {
                  const isUnlocked = unlocked.includes(a.id);
                  const selected = avatarDraft.accessory === a.id;
                  return (
                    <button
                      key={a.id}
                      disabled={!isUnlocked}
                      onClick={() => setAvatarDraft({ ...avatarDraft, accessory: a.id as AccessoryId })}
                      className="rounded-2xl p-2 text-center disabled:opacity-50"
                      style={{
                        background: selected ? "var(--violet-deep)" : "rgba(74,6,136,0.06)",
                        border: selected ? "2px solid var(--neon)" : "2px solid transparent",
                      }}
                    >
                      <div className="aspect-square flex items-center justify-center">
                        <Avatar config={{ ...avatarDraft, accessory: a.id as AccessoryId }} size={40} />
                      </div>
                      <div className="text-[10px] font-bold mt-1" style={{ color: selected ? "var(--volt)" : "#5a4a72" }}>{a.name}</div>
                      {!isUnlocked && <div className="text-[9px]" style={{ color: "#8a7aa0" }}>{a.unlock}</div>}
                    </button>
                  );
                })}
              </div>

              <button onClick={saveAvatar} className="btn-volt w-full mt-5 py-3.5">Save avatar</button>
            </div>
          )}

          {!editingAvatar && (
            <button
              onClick={startAvatar}
              className="w-full rounded-2xl py-3 font-bold text-sm inline-flex items-center justify-center gap-2"
              style={{ background: "rgba(168,85,247,0.15)", color: "var(--lavender)", border: "1px solid rgba(168,85,247,0.4)" }}
            >
              <Pencil className="size-4" /> Customize avatar
            </button>
          )}
        </div>
      </div>
    </FreeShell>
  );
}

function FieldRow({
  label, value, placeholder, type = "text", editing, draft, setDraft, onStart, onSave, onCancel,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  editing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  onStart: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(246,240,250,0.05)", border: "1px solid rgba(246,240,250,0.1)" }}>
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(246,240,250,0.5)" }}>{label}</div>
      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="flex-1 rounded-xl px-3 py-2 text-sm font-medium outline-none"
            style={{ background: "rgba(0,0,0,0.3)", color: "var(--lavender)", border: "1px solid rgba(168,85,247,0.4)" }}
          />
          <button onClick={onSave} className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--volt)", color: "var(--ink)" }}>
            <Check className="size-4" />
          </button>
          <button onClick={onCancel} className="size-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}>
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-sm font-medium truncate" style={{ color: value ? "var(--lavender)" : "rgba(246,240,250,0.4)" }}>
            {value || placeholder}
          </div>
          <button onClick={onStart} className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.15)", color: "var(--lavender)", border: "1px solid rgba(168,85,247,0.35)" }}>
            <Pencil className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
