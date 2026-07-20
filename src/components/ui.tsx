"use client";

import type { ReactNode } from "react";
import {
  Banknote, Briefcase, Building2, Bus, Camera, Car, Church, Coffee, Cross, Dumbbell,
  Filter, Fish, Fuel, GraduationCap, HandHeart, Hammer, Heart, Home, Hotel, KeyRound,
  Landmark, LogOut, Package, Phone, Scissors, Search, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Sparkles, Stethoscope, Store, Utensils, UserCircle, Wheat, Wine, Wrench, X,
  type LucideIcon,
} from "lucide-react";
import { C, inpStyle, lblStyle, STAGE_COLOR } from "@/lib/theme";
import type { Row } from "@/lib/types";

/**
 * The fixed set of icons an admin can pick from when creating a business type.
 * Keys are stored in business_types.icon; generic/common ones are listed first
 * so the picker reads sensibly.
 */
export const ICON_LIBRARY: Record<string, LucideIcon> = {
  Building2, Store, ShoppingBag, ShoppingCart, Shirt, Scissors, Utensils, Coffee, Wine,
  Cross, Stethoscope, Heart, Hotel, GraduationCap, Hammer, Wrench, Car, Fuel, Smartphone,
  Home, Briefcase, Landmark, Banknote, HandHeart, Church, Dumbbell, Camera, Package, Wheat,
  Fish, Bus, Sparkles,
};
export const ICON_CHOICES = Object.keys(ICON_LIBRARY);

/** Resolve a stored icon key to a component, with a safe generic fallback. */
export function iconFor(key?: string | null): LucideIcon {
  return (key && ICON_LIBRARY[key]) || Building2;
}

/* ---------------- TopBar ---------------- */
export function TopBar({
  name, subtitle, onLogout, onChangePassword, nav,
}: {
  name: string;
  subtitle: string;
  onLogout: () => void;
  onChangePassword?: () => void;
  nav?: ReactNode;
}) {
  return (
    <div style={{ background: C.ink, color: "#fff", position: "sticky", top: 0, zIndex: 20,
      boxShadow: "0 2px 20px rgba(11,46,36,.25)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "var(--gx-topbar-pad)",
        display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.green,
            display: "grid", placeItems: "center" }}><Phone size={16} color="#fff" strokeWidth={2.5} /></div>
          <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 18,
            letterSpacing: "-.02em" }}>
            <span className="gx-logo-full">geneline<span style={{ color: C.greenBright }}>-x</span></span>
            <span className="gx-logo-short">g<span style={{ color: C.greenBright }}>-x</span></span>
          </span>
        </div>
        {nav && <div style={{ marginLeft: 8, minWidth: 0 }}>{nav}</div>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div className="gx-hide-mobile" style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{subtitle}</div>
          </div>
          {onChangePassword && (
            <button onClick={onChangePassword} title="Change password" style={{ width: 34, height: 34, borderRadius: 9,
              border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.07)",
              color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <KeyRound size={16} />
            </button>
          )}
          <button onClick={onLogout} title="Sign out" style={{ width: 34, height: 34, borderRadius: 9,
            border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.07)",
            color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NavBtn({
  active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
      whiteSpace: "nowrap", padding: "8px 13px", borderRadius: 9, border: "none", cursor: "pointer",
      fontFamily: "inherit", fontSize: 13.5, fontWeight: 600,
      background: active ? "rgba(37,211,102,.18)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,.6)" }}>
      <Icon size={16} /> {children}
    </button>
  );
}

/* ---------------- BizCard ---------------- */
export function BizCard({
  r, onClick, onOnboard, showAgent,
}: {
  r: Row;
  onClick: () => void;
  onOnboard?: (() => void) | null;
  showAgent?: boolean;
}) {
  const Icon = iconFor(r.typeIcon);
  return (
    <div onClick={onClick} className="gx-bizcard" style={{ background: C.card, border: `1px solid ${C.line}`,
      borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "transform .12s, box-shadow .12s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(11,46,36,.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div className="gx-bizcard-icon" style={{ width: 42, height: 42, borderRadius: 11, background: C.paper,
        display: "grid", placeItems: "center", color: C.green }}><Icon size={20} /></div>
      <div className="gx-bizcard-info">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{r.name}</span>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Archivo',sans-serif",
            fontWeight: 700, background: C.paper, padding: "2px 7px", borderRadius: 6 }}>{r.code}</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis" }}>
          <Phone size={12} style={{ display: "inline", verticalAlign: -1, marginRight: 4 }} />
          {r.contact}{r.objection ? ` · ${r.objection}` : ""}
        </div>
      </div>
      <div className="gx-bizcard-meta">
        <Tag color={STAGE_COLOR[r.stage]}>{r.stage}</Tag>
        {showAgent && <span style={{ fontSize: 11.5, color: C.muted }}>{r.agent}</span>}
        {r.monthlyFee != null && <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Le {r.monthlyFee}/mo</span>}
      </div>
      {onOnboard && (
        <button onClick={e => { e.stopPropagation(); onOnboard(); }} className="gx-bizcard-onboard" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10,
          border: "none", background: C.greenBright, color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", fontFamily: "inherit" }}>
          <UserCircle size={15} /> Onboard
        </button>
      )}
    </div>
  );
}

/* ---------------- Stat / Panel ---------------- */
export function Stat({
  label, value, icon: Icon, tint, big,
}: { label: string; value: string | number; icon: LucideIcon; tint: string; big?: boolean }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: big ? "17px 18px" : "14px 15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: tint + "18",
          display: "grid", placeItems: "center", color: tint }}><Icon size={16} /></div>
      </div>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800,
        fontSize: big ? "var(--gx-stat-big)" : "var(--gx-stat)",
        color: C.ink, marginTop: 6, letterSpacing: "-.02em" }}>{value}</div>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15,
        color: C.ink, marginBottom: 15 }}>{title}</div>
      {children}
    </div>
  );
}

/* ---------------- Inputs ---------------- */
export function SearchBar({
  q, setQ, placeholder,
}: { q: string; setQ: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={17} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
        style={{ ...inpStyle, paddingLeft: 40, marginBottom: 0 }} />
    </div>
  );
}

export function Select({
  value, onChange, opts, icon: Icon = Filter,
}: { value: string; onChange: (v: string) => void; opts: string[]; icon?: LucideIcon }) {
  return (
    <div style={{ position: "relative" }}>
      <Icon size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inpStyle, paddingLeft: 34, marginBottom: 0, minWidth: 130, cursor: "pointer" }}>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ---------------- Small bits ---------------- */
export function Tag({ children, color, soft }: { children: ReactNode; color: string; soft?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap",
      background: soft ? color + "14" : color, color: soft ? color : "#fff" }}>{children}</span>
  );
}

export function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <Icon size={16} style={{ color: C.muted, marginTop: 2, flexShrink: 0 }} />
      <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted,
      background: C.card, borderRadius: 14, border: `1px dashed ${C.line}` }}>
      <Building2 size={30} style={{ opacity: .4, marginBottom: 8 }} />
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

/* ---------------- Modal shell ---------------- */
export function Modal({
  children, onClose, title, badge, accent = C.green,
}: { children: ReactNode; onClose: () => void; title: string; badge?: string; accent?: string }) {
  return (
    <div onClick={onClose} className="gx-modal-overlay" style={{ background: "rgba(11,46,36,.5)",
      backdropFilter: "blur(3px)" }}>
      <div onClick={e => e.stopPropagation()} className="gx-modal-card" style={{ background: C.card,
        boxShadow: "0 24px 60px rgba(11,46,36,.35)" }}>
        <div style={{ padding: "20px var(--gx-modal-px) 0", display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: "var(--gx-modal-title)",
              color: C.ink, margin: 0, letterSpacing: "-.02em" }}>{title}</h2>
            {badge && <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700,
              fontFamily: "'Archivo',sans-serif", color: accent, background: accent + "16",
              padding: "3px 9px", borderRadius: 7 }}>{badge}</span>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none",
            background: C.paper, cursor: "pointer", display: "grid", placeItems: "center", color: C.muted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "18px var(--gx-modal-px) 22px" }}>{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={lblStyle}>{label}</label>{children}</div>;
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "var(--gx-form-row)", gap: 12 }}>{children}</div>;
}
