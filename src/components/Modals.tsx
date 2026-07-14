"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, ChevronRight, Clock, DollarSign, KeyRound, Mail, MapPin, Phone, UserCircle, XCircle,
} from "lucide-react";
import { C, ghostBtn, inpStyle, primaryBtn, STAGES, STAGE_COLOR, TYPES } from "@/lib/theme";
import type { BizType, Row, Stage } from "@/lib/types";
import { createAgent, onboardBusiness, saveBusiness } from "@/lib/actions";
import { Field, FormRow, Info, Modal, ModalFooter, Tag, TYPE_ICON } from "./ui";

/* ---------------- VisitModal: add / update a business ---------------- */
export function VisitModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    name: row?.name ?? "",
    address: row?.address ?? "",
    contact: row?.contact ?? "",
    type: (row?.type ?? "Salon") as BizType,
    stage: (row?.stage ?? "New") as Stage,
    objection: row?.objection ?? "",
    lostReason: row?.lostReason ?? "",
    nextAction: row?.nextAction ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.contact.trim();

  const submit = () => {
    start(async () => {
      await saveBusiness({ dbId: row?.dbId, ...f });
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal onClose={onClose} title={row ? "Update business" : "Log a new business"} badge={row?.code}>
      <Field label="Business name">
        <input style={inpStyle} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dolley Beauty" />
      </Field>
      <Field label="Address / location">
        <input style={inpStyle} value={f.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 12 Wilkinson Rd, Freetown" />
      </Field>
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
      <Field label="Next action">
        <input style={inpStyle} value={f.nextAction} onChange={e => set("nextAction", e.target.value)} placeholder="e.g. Reach out Friday" />
      </Field>
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose} disabled={pending}>Cancel</button>
        <button style={{ ...primaryBtn, opacity: valid && !pending ? 1 : .5, pointerEvents: valid && !pending ? "auto" : "none" }}
          onClick={submit}>{pending ? "Saving…" : "Save"}</button>
      </ModalFooter>
    </Modal>
  );
}

/* ---------------- OnboardModal: set up account for a closed deal ---------------- */
export function OnboardModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const defPrice = TYPES.find(t => t.key === row.type)?.price ?? 500;
  const [a, setA] = useState({ ownerName: "", email: "", personalPhone: row.contact, password: "" });
  const [price, setPrice] = useState<number>(row.price ?? defPrice);
  const set = (k: keyof typeof a, v: string) => setA(p => ({ ...p, [k]: v }));
  const valid = a.ownerName.trim() && a.email.trim() && a.password.trim();

  const submit = () => {
    start(async () => {
      await onboardBusiness(row.dbId, a, price);
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
        <Field label="Agreed price (Le)"><input type="number" style={inpStyle} value={price}
          onChange={e => setPrice(Number(e.target.value))} /></Field>
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

/* ---------------- DetailModal: read-only full record (admin) ---------------- */
export function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const Icon = TYPE_ICON[row.type];
  return (
    <Modal onClose={onClose} title={row.name} badge={row.code}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={STAGE_COLOR[row.stage]}>{row.stage}</Tag>
          <Tag color={C.ink} soft><Icon size={13} /> {row.type}</Tag>
          <Tag color={C.green} soft><UserCircle size={13} /> {row.agent}</Tag>
          {row.onboarded && <Tag color={C.greenBright}><CheckCircle2 size={13} /> Onboarded</Tag>}
        </div>
        <Info icon={MapPin} label="Address / location" value={row.address || "—"} />
        <Info icon={Phone} label="Contact" value={row.contact} />
        <Info icon={Clock} label="Objection / note" value={row.objection || "—"} />
        {row.stage === "Lost" && <Info icon={XCircle} label="Why lost" value={row.lostReason || "—"} />}
        <Info icon={ChevronRight} label="Next action" value={row.nextAction || "—"} />
        <Info icon={DollarSign} label="Price" value={row.price != null ? `Le ${row.price}` : "Not set"} />

        {row.onboarded && row.account && (
          <div style={{ marginTop: 4, padding: 16, background: C.paper, borderRadius: 13 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase",
              letterSpacing: ".05em", marginBottom: 12 }}>Account details</div>
            <div style={{ display: "grid", gap: 10 }}>
              <Info icon={UserCircle} label="Owner" value={row.account.ownerName} />
              <Info icon={Mail} label="Email" value={row.account.email} />
              <Info icon={Phone} label="Personal phone" value={row.account.personalPhone || "—"} />
              <Info icon={KeyRound} label="Password" value="••••••" />
            </div>
          </div>
        )}
      </div>
      <ModalFooter><button style={primaryBtn} onClick={onClose}>Close</button></ModalFooter>
    </Modal>
  );
}
