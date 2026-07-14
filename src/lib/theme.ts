import type { CSSProperties } from "react";

/* ============================ THEME ============================ */
export const C = {
  ink: "#0B2E24",
  green: "#128C7E",
  greenBright: "#25D366",
  paper: "#F5F2EA",
  card: "#FFFFFF",
  line: "#E4DFD2",
  clay: "#C9663A",
  amber: "#E0A030",
  muted: "#6B7A72",
};

export const STAGES = ["New", "Interested", "Reluctant", "Absent", "Won", "Lost"] as const;
export const STAGE_COLOR: Record<string, string> = {
  New: "#8892A0",
  Interested: C.green,
  Reluctant: C.amber,
  Absent: C.clay,
  Won: C.greenBright,
  Lost: "#B0483C",
};

export const TYPES = [
  { key: "Salon", price: 500 },
  { key: "Restaurant", price: 500 },
  { key: "Corporate", price: 1500 },
] as const;

/* ============================ STYLE TOKENS ============================ */
export const pageStyle: CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "26px 22px 60px" };
export const h1Style: CSSProperties = {
  fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 27,
  color: C.ink, margin: 0, letterSpacing: "-.025em",
};
export const lblStyle: CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.muted, marginBottom: 6 };
export const inpStyle: CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`,
  fontSize: 14, fontFamily: "inherit", color: C.ink, background: "#fff", marginBottom: 0,
};
export const primaryBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 17px",
  borderRadius: 11, border: "none", background: C.green, color: "#fff", fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(18,140,126,.3)",
};
export const ghostBtn: CSSProperties = {
  padding: "11px 17px", borderRadius: 11, border: `1.5px solid ${C.line}`,
  background: "#fff", color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
