"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock, CheckCircle2, ChevronRight, Clock, Copy, DollarSign, KeyRound, Mail, MapPin, Phone, RefreshCw, Trash2, UserCircle, XCircle,
} from "lucide-react";
import { C, ghostBtn, inpStyle, primaryBtn, STAGES, STAGE_COLOR, TYPES } from "@/lib/theme";
import type { AccountStatus, BizType, Row, Stage } from "@/lib/types";
import { changeOwnPassword, createAgent, onboardBusiness, removeAgent, resetUserPassword, saveBusiness, setAccountStatus } from "@/lib/actions";

const UNASSIGNED_EMAIL = "unassigned@geneline-x.com";
import { queueNewBusiness } from "@/lib/offline/queue";
import { Field, FormRow, Info, Modal, ModalFooter, Tag, typeIcon } from "./ui";

/* ---------------- VisitModal: add / update a business ---------------- */
export function VisitModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    name: row?.name ?? "",
    address: row?.address ?? "",
    contactName: row?.contactName ?? "",
    contact: row?.contact ?? "",
    type: (row?.type ?? "Salon") as BizType,
    stage: (row?.stage ?? "New") as Stage,
    objection: row?.objection ?? "",
    lostReason: row?.lostReason ?? "",
    nextAction: row?.nextAction ?? "",
    followUpDate: row?.followUpDate ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.contact.trim();
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const isNew = !row;

  // Track connectivity so we can queue new businesses when offline.
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
    };
  }, []);

  const submit = () => {
    setError(null);
    // Offline: queue new businesses on the device; editing needs a connection.
    if (!online) {
      if (!isNew) {
        setError("You're offline. Editing an existing business needs a connection — it'll work again once you're back online.");
        return;
      }
      start(async () => {
        try {
          await queueNewBusiness({ ...f });
          setQueued(true);
        } catch {
          setError("Couldn't save on this device. Please try again.");
        }
      });
      return;
    }
    start(async () => {
      const res = await saveBusiness({ dbId: row?.dbId, ...f });
      if (res?.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  };

  if (queued) {
    return (
      <Modal onClose={onClose} title="Saved offline" accent={C.amber}>
        <div style={{ padding: "6px 2px 4px", fontSize: 14, color: C.ink, lineHeight: 1.55 }}>
          <b>{f.name}</b> is saved on this device. It&apos;ll sync automatically as soon as
          you&apos;re back online — you don&apos;t need to do anything.
        </div>
        <ModalFooter><button style={primaryBtn} onClick={onClose}>Done</button></ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title={row ? "Update business" : "Log a new business"} badge={row?.code}>
      <Field label="Business name">
        <input style={inpStyle} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dolley Beauty" />
      </Field>
      <FormRow>
        <Field label="Owner / contact person">
          <input style={inpStyle} value={f.contactName} onChange={e => set("contactName", e.target.value)} placeholder="e.g. Mary" />
        </Field>
        <Field label="Address / location">
          <input style={inpStyle} value={f.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 12 Wilkinson Rd" />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Contact number">
          <input style={inpStyle} value={f.contact} onChange={e => set("contact", e.target.value)} placeholder="07…" />
        </Field>
        <Field label="Business type">
          <select style={inpStyle} value={f.type} onChange={e => set("type", e.target.value)}>
            {TYPES.map(t => <option key={t.key}>{t.key}</option>)}
          </select>
        </Field>
      </FormRow>
      <Field label="Stage">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STAGES.map(s => (
            <button key={s} onClick={() => set("stage", s)} style={{
              padding: "8px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", border: `1.5px solid ${f.stage === s ? STAGE_COLOR[s] : C.line}`,
              background: f.stage === s ? STAGE_COLOR[s] : "#fff",
              color: f.stage === s ? "#fff" : C.muted }}>{s}</button>
          ))}
        </div>
      </Field>
      {f.stage === "Lost" && (
        <Field label="Why lost?">
          <input style={inpStyle} value={f.lostReason} onChange={e => set("lostReason", e.target.value)}
            placeholder="e.g. Price too high, chose a competitor, not interested" />
        </Field>
      )}
      <Field label="Objection / note">
        <input style={inpStyle} value={f.objection} onChange={e => set("objection", e.target.value)} placeholder="What's holding them back?" />
      </Field>
      <FormRow>
        <Field label="Next action">
          <input style={inpStyle} value={f.nextAction} onChange={e => set("nextAction", e.target.value)} placeholder="e.g. Reach out Friday" />
        </Field>
        <Field label="Follow up on">
          <input type="date" style={inpStyle} value={f.followUpDate} onChange={e => set("followUpDate", e.target.value)} />
        </Field>
      </FormRow>
      {error && (
        <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{error}</p>
      )}
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
        <button style={{ ...primaryBtn, opacity: valid && !pending ? 1 : .5, pointerEvents: valid && !pending ? "auto" : "none" }}
          onClick={submit}>{pending ? "Saving…" : !online && isNew ? "Save offline" : "Save"}</button>
      </ModalFooter>
    </Modal>
  );
}

/* ---------------- OnboardModal: set up account for a closed deal ---------------- */
export function OnboardModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const defFee = TYPES.find(t => t.key === row.type)?.price ?? 500;
  const [a, setA] = useState({ ownerName: "", email: "", personalPhone: row.contact, password: "" });
  const [fee, setFee] = useState<number>(row.monthlyFee ?? defFee);
  const set = (k: keyof typeof a, v: string) => setA(p => ({ ...p, [k]: v }));
  const valid = a.ownerName.trim() && a.email.trim() && a.password.trim();

  const submit = () => {
    start(async () => {
      await onboardBusiness(row.dbId, a, fee);
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal onClose={onClose} title="Onboard — set up account" badge={row.code} accent={C.greenBright}>
      <div style={{ background: "rgba(37,211,102,.1)", border: `1px solid ${C.greenBright}44`,
        borderRadius: 11, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: C.ink }}>
        Setting up <b>{row.name}</b>. This account links to business ID <b>{row.code}</b>.
      </div>
      <Field label="Owner / contact name"><input style={inpStyle} value={a.ownerName}
        onChange={e => set("ownerName", e.target.value)} placeholder="Full name" /></Field>
      <FormRow>
        <Field label="Email"><input style={inpStyle} value={a.email}
          onChange={e => set("email", e.target.value)} placeholder="name@mail.com" /></Field>
        <Field label="Personal phone"><input style={inpStyle} value={a.personalPhone}
          onChange={e => set("personalPhone", e.target.value)} /></Field>
      </FormRow>
      <FormRow>
        <Field label="Password"><input type="password" style={inpStyle} value={a.password}
          onChange={e => set("password", e.target.value)} placeholder="Set login password" /></Field>
        <Field label="Monthly fee (Le/mo)"><input type="number" style={inpStyle} value={fee}
          onChange={e => setFee(Number(e.target.value))} /></Field>
      </FormRow>
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
        <button style={{ ...primaryBtn, background: C.greenBright, boxShadow: "0 4px 14px rgba(37,211,102,.35)",
          opacity: valid && !pending ? 1 : .5, pointerEvents: valid && !pending ? "auto" : "none" }}
          onClick={submit}>
          <CheckCircle2 size={17} strokeWidth={2.5} /> {pending ? "Onboarding…" : "Complete onboarding"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

/* ---------------- AddAgentModal: admin creates a user ---------------- */
export function AddAgentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAgent, {});

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state.ok, router, onClose]);

  return (
    <Modal onClose={onClose} title="Add a user">
      <form action={formAction}>
        <Field label="Full name">
          <input name="name" style={inpStyle} placeholder="e.g. Aminata Kamara" autoComplete="off" />
        </Field>
        <Field label="Login email">
          <input name="email" type="email" style={inpStyle} placeholder="name@geneline-x.com" autoComplete="off" />
        </Field>
        <FormRow>
          <Field label="Role">
            <select name="role" style={inpStyle} defaultValue="agent">
              <option value="agent">Sales Agent</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Temporary password">
            <input name="password" type="text" style={inpStyle} placeholder="At least 6 characters" autoComplete="off" />
          </Field>
        </FormRow>
        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
          Share this password with the user — they sign in with the email and password above.
        </p>

        {state.error && (
          <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{state.error}</p>
        )}

        <ModalFooter>
          <button type="button" style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
          <button type="submit" style={{ ...primaryBtn, opacity: pending ? .6 : 1 }} disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ---------------- ChangePasswordModal: any user changes their own ---------------- */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(changeOwnPassword, {});

  if (state.ok) {
    return (
      <Modal onClose={onClose} title="Password changed" accent={C.greenBright}>
        <div style={{ padding: "6px 2px 4px", fontSize: 14, color: C.ink, lineHeight: 1.55 }}>
          Your password has been updated. Use it the next time you sign in.
        </div>
        <ModalFooter><button style={primaryBtn} onClick={onClose}>Done</button></ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Change password">
      <form action={formAction}>
        <Field label="Current password">
          <input name="current" type="password" style={inpStyle} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <input name="next" type="password" style={inpStyle} placeholder="At least 6 characters" autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <input name="confirm" type="password" style={inpStyle} autoComplete="new-password" />
        </Field>
        {state.error && (
          <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{state.error}</p>
        )}
        <ModalFooter>
          <button type="button" style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
          <button type="submit" style={{ ...primaryBtn, opacity: pending ? .6 : 1 }} disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ---------------- ResetPasswordModal: admin resets an agent's password ---------------- */
// Unambiguous alphabet (no O/0, I/l/1) so shared passwords are easy to type on a phone.
const PW_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generatePassword(len = 12): string {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => PW_CHARS[n % PW_CHARS.length]).join("");
}

export function ResetPasswordModal({
  agent, onClose,
}: { agent: { id: number; name: string }; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetUserPassword, {});
  const [pw, setPw] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);

  if (state.ok) {
    return (
      <Modal onClose={onClose} title="Password reset" badge={agent.name} accent={C.greenBright}>
        <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.55, marginBottom: 14 }}>
          {agent.name}&apos;s new password is ready. Copy it and send it over now — it won&apos;t be shown again.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.paper,
          borderRadius: 11, padding: "12px 14px" }}>
          <code style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: C.ink,
            wordBreak: "break-all", fontFamily: "'Archivo',monospace" }}>{pw}</code>
          <button onClick={() => { navigator.clipboard?.writeText(pw); setCopied(true); }}
            style={{ ...ghostBtn, padding: "8px 12px", display: "inline-flex", alignItems: "center",
              gap: 6, flexShrink: 0, color: copied ? C.green : C.muted }}>
            <Copy size={14} /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <ModalFooter><button style={primaryBtn} onClick={onClose}>Done</button></ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Reset password" badge={agent.name}>
      <form action={formAction}>
        <input type="hidden" name="userId" value={agent.id} />
        <Field label="New password">
          <div style={{ display: "flex", gap: 8 }}>
            <input name="next" type="text" style={{ ...inpStyle, flex: 1, minWidth: 0 }} value={pw}
              onChange={e => setPw(e.target.value)} placeholder="Type one or generate" autoComplete="off" />
            <button type="button" onClick={() => setPw(generatePassword())}
              style={{ ...ghostBtn, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={15} /> Generate
            </button>
          </div>
        </Field>
        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
          {agent.name} signs in with their email and this new password. Share it over WhatsApp.
        </p>
        {state.error && (
          <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{state.error}</p>
        )}
        <ModalFooter>
          <button type="button" style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
          <button type="submit" style={{ ...primaryBtn,
            opacity: pw.length >= 6 && !pending ? 1 : .5,
            pointerEvents: pw.length >= 6 && !pending ? "auto" : "none" }}>
            <KeyRound size={16} /> {pending ? "Resetting…" : "Reset password"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ---------------- RemoveAgentModal: admin deletes an agent ---------------- */
export function RemoveAgentModal({
  agent, bizCount, targets, onClose,
}: {
  agent: { id: number; name: string };
  bizCount: number;
  targets: { id: number; name: string; email: string }[]; // possible new owners (excludes this agent)
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Default to the Unassigned holding account so the businesses are never orphaned.
  const unassigned = targets.find(t => t.email === UNASSIGNED_EMAIL);
  const [dest, setDest] = useState<number>(unassigned?.id ?? targets[0]?.id ?? 0);

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await removeAgent(agent.id, dest);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal onClose={onClose} title="Remove agent" badge={agent.name} accent={C.clay}>
      <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.55, marginBottom: bizCount > 0 ? 16 : 6 }}>
        {bizCount > 0
          ? <>Removing <b>{agent.name}</b> deletes their login for good. Their <b>{bizCount}</b>{" "}
              {bizCount === 1 ? "business needs" : "businesses need"} a new owner — pick who takes over.</>
          : <>Removing <b>{agent.name}</b> permanently deletes their login. They own no businesses, so nothing is reassigned.</>}
      </div>
      {bizCount > 0 && (
        <Field label="Move their businesses to">
          <select style={inpStyle} value={dest} onChange={e => setDest(Number(e.target.value))}>
            {targets.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}{t.email === UNASSIGNED_EMAIL ? " (holding account)" : ""}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && (
        <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{error}</p>
      )}
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
        <button onClick={submit} style={{ ...primaryBtn, background: C.clay,
          boxShadow: "0 4px 14px rgba(201,102,58,.35)",
          opacity: (bizCount > 0 && !dest) || pending ? .5 : 1,
          pointerEvents: (bizCount > 0 && !dest) || pending ? "none" : "auto" }}>
          <Trash2 size={16} /> {pending ? "Removing…" : "Remove agent"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

/* ---------------- DetailModal: read-only full record (admin) ---------------- */
const ACCOUNT_STATUSES: AccountStatus[] = ["Pending", "Active", "Paused", "Churned"];
const STATUS_COLOR: Record<AccountStatus, string> = {
  Pending: "#8892A0", Active: C.greenBright, Paused: C.amber, Churned: "#B0483C",
};

export function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const Icon = typeIcon(row.type);
  const router = useRouter();
  const [pending, start] = useTransition();
  const changeStatus = (s: AccountStatus) =>
    start(async () => {
      await setAccountStatus(row.dbId, s);
      router.refresh();
    });
  return (
    <Modal onClose={onClose} title={row.name} badge={row.code}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={STAGE_COLOR[row.stage]}>{row.stage}</Tag>
          <Tag color={C.ink} soft><Icon size={13} /> {row.type}</Tag>
          <Tag color={C.green} soft><UserCircle size={13} /> {row.agent}</Tag>
          {row.onboarded && <Tag color={C.greenBright}><CheckCircle2 size={13} /> Onboarded</Tag>}
        </div>
        <Info icon={UserCircle} label="Owner / contact person" value={row.contactName || "—"} />
        <Info icon={MapPin} label="Address / location" value={row.address || "—"} />
        <Info icon={Phone} label="Contact" value={row.contact} />
        <Info icon={Clock} label="Objection / note" value={row.objection || "—"} />
        {row.stage === "Lost" && <Info icon={XCircle} label="Why lost" value={row.lostReason || "—"} />}
        <Info icon={ChevronRight} label="Next action" value={row.nextAction || "—"} />
        <Info icon={CalendarClock} label="Follow up on" value={row.followUpDate || "—"} />
        <Info icon={DollarSign} label="Monthly fee" value={row.monthlyFee != null ? `Le ${row.monthlyFee}/mo` : "Not set"} />

        {row.onboarded && row.account && (
          <div style={{ marginTop: 4, padding: 16, background: C.paper, borderRadius: 13 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                letterSpacing: ".05em" }}>Account details</div>
              <Tag color={STATUS_COLOR[row.account.status]}>{row.account.status}</Tag>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Info icon={UserCircle} label="Owner" value={row.account.ownerName} />
              <Info icon={Mail} label="Email" value={row.account.email} />
              <Info icon={Phone} label="Personal phone" value={row.account.personalPhone || "—"} />
              <Info icon={KeyRound} label="Password" value="••••••" />
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, marginBottom: 6 }}>Customer status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ACCOUNT_STATUSES.map(s => {
                  const active = row.account!.status === s;
                  return (
                    <button key={s} onClick={() => changeStatus(s)} disabled={pending || active} style={{
                      padding: "7px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                      cursor: pending || active ? "default" : "pointer", fontFamily: "inherit",
                      border: `1.5px solid ${active ? STATUS_COLOR[s] : C.line}`,
                      background: active ? STATUS_COLOR[s] : "#fff",
                      color: active ? "#fff" : C.muted, opacity: pending && !active ? .5 : 1 }}>{s}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <ModalFooter><button style={primaryBtn} onClick={onClose}>Close</button></ModalFooter>
    </Modal>
  );
}
