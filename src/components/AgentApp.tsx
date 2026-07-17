"use client";

import { useState } from "react";
import { Building2, CalendarClock, CheckCircle2, Plus, Target, TrendingUp } from "lucide-react";
import { C, h1Style, pageStyle, primaryBtn } from "@/lib/theme";
import type { Row } from "@/lib/types";
import { signOutAction } from "@/lib/actions";
import { BizCard, Empty, SearchBar, Stat, TopBar } from "./ui";
import { OnboardModal, VisitModal } from "./Modals";

type DailyProgress = { touchedToday: number; createdToday: number; target: number };

export default function AgentApp({
  rows, progress, agentName,
}: { rows: Row[]; progress: DailyProgress; agentName: string }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [onboard, setOnboard] = useState<Row | null>(null);

  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const stats = {
    total: rows.length,
    interested: rows.filter(r => r.stage === "Interested").length,
    won: rows.filter(r => r.stage === "Won").length,
  };

  // Follow-ups: open (not onboarded, not dead) businesses with a due date.
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const openWithDate = rows.filter(r => !r.onboarded && r.stage !== "Lost" && r.followUpDate);
  const overdue = openWithDate
    .filter(r => r.followUpDate! < today)
    .sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));
  const dueToday = openWithDate.filter(r => r.followUpDate === today);

  const onboardOf = (r: typeof rows[number]) =>
    r.stage === "Won" && !r.onboarded ? () => setOnboard(r) : null;

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

        <DailyQuota progress={progress} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <Stat label="Total logged" value={stats.total} icon={Building2} tint={C.green} />
          <Stat label="Interested" value={stats.interested} icon={TrendingUp} tint={C.amber} />
          <Stat label="Won" value={stats.won} icon={CheckCircle2} tint={C.greenBright} />
        </div>

        {(overdue.length > 0 || dueToday.length > 0) && (
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            {overdue.length > 0 && (
              <DueSection title="Overdue" count={overdue.length} color="#B0483C"
                rows={overdue} onOpen={setEditing} onboardOf={onboardOf} />
            )}
            {dueToday.length > 0 && (
              <DueSection title="Due today" count={dueToday.length} color={C.amber}
                rows={dueToday} onOpen={setEditing} onboardOf={onboardOf} />
            )}
          </div>
        )}

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

function DailyQuota({ progress }: { progress: DailyProgress }) {
  const { touchedToday, target } = progress;
  const met = touchedToday >= target;
  const pct = Math.min(100, Math.round((touchedToday / target) * 100));
  const tint = met ? C.greenBright : pct >= 60 ? C.amber : C.clay;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${tint}`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Target size={17} style={{ color: tint }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: C.ink, flex: 1 }}>Today&apos;s target</span>
        <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 18, color: tint }}>
          {touchedToday}<span style={{ color: C.muted, fontWeight: 600, fontSize: 14 }}> / {target}</span>
        </span>
      </div>
      <div style={{ height: 8, background: C.paper, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: tint, borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 7 }}>
        {met
          ? "Nice — you've hit your 15 businesses for today."
          : `${target - touchedToday} more ${target - touchedToday === 1 ? "business" : "businesses"} to talk to today.`}
      </div>
    </div>
  );
}

function DueSection({
  title, count, color, rows, onOpen, onboardOf,
}: {
  title: string;
  count: number;
  color: string;
  rows: Row[];
  onOpen: (r: Row) => void;
  onboardOf: (r: Row) => (() => void) | null;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${color}44`, borderLeft: `4px solid ${color}`,
      borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <CalendarClock size={16} style={{ color }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{title}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: color,
          padding: "1px 8px", borderRadius: 20 }}>{count}</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(r => (
          <BizCard key={r.dbId} r={r} onClick={() => onOpen(r)} onOnboard={onboardOf(r)} />
        ))}
      </div>
    </div>
  );
}
