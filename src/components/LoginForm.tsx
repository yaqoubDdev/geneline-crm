"use client";

import { useActionState } from "react";
import { Phone } from "lucide-react";
import { C, inpStyle, lblStyle } from "@/lib/theme";
import { authenticate } from "@/lib/actions";

export default function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.green,
              display: "grid", placeItems: "center", boxShadow: "0 4px 14px rgba(18,140,126,.35)" }}>
              <Phone size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 26,
              letterSpacing: "-.02em", color: C.ink }}>geneline<span style={{ color: C.green }}>-x</span></span>
          </div>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Sales &amp; Onboarding CRM</p>
        </div>

        <form action={formAction} style={{ background: C.card, borderRadius: 18, padding: 26,
          border: `1px solid ${C.line}`, boxShadow: "0 10px 40px rgba(11,46,36,.08)" }}>
          <label style={lblStyle}>Email</label>
          <input name="email" type="email" required style={inpStyle}
            placeholder="you@geneline-x.com" defaultValue="" autoComplete="username" />

          <label style={{ ...lblStyle, marginTop: 14 }}>Password</label>
          <input name="password" type="password" required style={inpStyle}
            placeholder="••••••••" autoComplete="current-password" />

          {error && (
            <p style={{ color: C.clay, fontSize: 13, fontWeight: 600, margin: "14px 0 0" }}>{error}</p>
          )}

          <button type="submit" disabled={pending}
            style={{ width: "100%", marginTop: 22, padding: "13px 0", border: "none",
              borderRadius: 11, background: C.green, color: "#fff", fontSize: 15,
              fontWeight: 700, cursor: pending ? "default" : "pointer", fontFamily: "inherit",
              opacity: pending ? .6 : 1, boxShadow: "0 4px 14px rgba(18,140,126,.3)" }}>
            {pending ? "Signing in…" : "Sign in"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 16, marginBottom: 0 }}>
            Admin sees every business & metric. Agents see only their own.
          </p>
        </form>
      </div>
    </div>
  );
}
