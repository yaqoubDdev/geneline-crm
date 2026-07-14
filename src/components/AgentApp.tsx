"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Plus, TrendingUp } from "lucide-react";
import { C, h1Style, pageStyle, primaryBtn } from "@/lib/theme";
import type { Row } from "@/lib/types";
import { signOutAction } from "@/lib/actions";
import { BizCard, Empty, SearchBar, Stat, TopBar } from "./ui";
import { OnboardModal, VisitModal } from "./Modals";

export default function AgentApp({ rows, agentName }: { rows: Row[]; agentName: string }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [onboard, setOnboard] = useState<Row | null>(null);

  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const stats = {
    total: rows.length,
    interested: rows.filter(r => r.stage === "Interested").length,
    won: rows.filter(r => r.stage === "Won").length,
  };

  return (
    <>
      <TopBar name={agentName} subtitle="Field agent" onLogout={() => signOutAction()} />
      <div style={pageStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <h1 style={h1Style}>My pipeline</h1>
            <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 14 }}>
              Businesses you&apos;re working. Log a visit or close a deal.</p>
          </div>
          <button onClick={() => setEditing("new")} style={primaryBtn}>
            <Plus size={17} strokeWidth={2.5} /> Add business
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <Stat label="Total logged" value={stats.total} icon={Building2} tint={C.green} />
          <Stat label="Interested" value={stats.interested} icon={TrendingUp} tint={C.amber} />
          <Stat label="Won" value={stats.won} icon={CheckCircle2} tint={C.greenBright} />
        </div>

        <SearchBar q={q} setQ={setQ} placeholder="Search my businesses…" />

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {filtered.length === 0 && <Empty text="No businesses yet. Tap “Add business” after your next visit." />}
          {filtered.map(r => (
            <BizCard key={r.dbId} r={r} onClick={() => setEditing(r)}
              onOnboard={r.stage === "Won" && !r.onboarded ? () => setOnboard(r) : null} />
          ))}
        </div>
      </div>

      {editing && <VisitModal row={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {onboard && <OnboardModal row={onboard} onClose={() => setOnboard(null)} />}
    </>
  );
}
