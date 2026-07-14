"use client";

import { useMemo, useState } from "react";
import {
  Building2, CheckCircle2, DollarSign, LayoutDashboard, Mail, Plus, TrendingUp, Users, UserCircle,
} from "lucide-react";
import { C, h1Style, pageStyle, primaryBtn, STAGE_COLOR, STAGES, TYPES } from "@/lib/theme";
import type { Row } from "@/lib/types";
import { signOutAction } from "@/lib/actions";
import { BizCard, Empty, NavBtn, Panel, SearchBar, Select, Stat, TopBar } from "./ui";
import { AddAgentModal, DetailModal } from "./Modals";

type AgentInfo = { id: number; name: string; email: string };

export default function AdminApp({
  rows, agentList, adminName,
}: { rows: Row[]; agentList: AgentInfo[]; adminName: string }) {
  const agents = agentList.map((a) => a.name);
  const [view, setView] = useState<"dashboard" | "all" | "agents">("dashboard");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("All");
  const [fAgent, setFAgent] = useState("All");
  const [detail, setDetail] = useState<Row | null>(null);
  const [addAgent, setAddAgent] = useState(false);

  const m = useMemo(() => {
    const won = rows.filter(r => r.stage === "Won");
    const revenue = won.reduce((s, r) => s + (r.price || 0), 0);
    const byAgent = agents.map(a => {
      const rs = rows.filter(r => r.agent === a);
      return {
        agent: a, total: rs.length, won: rs.filter(r => r.stage === "Won").length,
        revenue: rs.filter(r => r.stage === "Won").reduce((s, r) => s + (r.price || 0), 0),
      };
    }).sort((x, y) => y.won - x.won);
    const byStage = STAGES.map(s => ({ stage: s, n: rows.filter(r => r.stage === s).length }));
    const lostReasons = Object.entries(
      rows.filter(r => r.stage === "Lost").reduce<Record<string, number>>((acc, r) => {
        const key = r.lostReason?.trim() || "Unspecified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);
    return {
      total: rows.length, won: won.length, revenue,
      onboarded: rows.filter(r => r.onboarded).length,
      convRate: rows.length ? Math.round(won.length / rows.length * 100) : 0,
      byAgent, byStage, lostReasons,
    };
  }, [rows, agents]);

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) &&
    (fType === "All" || r.type === fType) &&
    (fAgent === "All" || r.agent === fAgent));

  return (
    <>
      <TopBar name={adminName} subtitle="Admin" onLogout={() => signOutAction()}
        nav={<div style={{ display: "flex", gap: 4 }}>
          <NavBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={LayoutDashboard}>Dashboard</NavBtn>
          <NavBtn active={view === "all"} onClick={() => setView("all")} icon={Building2}>All businesses</NavBtn>
          <NavBtn active={view === "agents"} onClick={() => setView("agents")} icon={Users}>Agents</NavBtn>
        </div>} />

      <div style={pageStyle}>
        {view === "dashboard" ? (
          <>
            <h1 style={h1Style}>Company overview</h1>
            <p style={{ color: C.muted, margin: "4px 0 22px", fontSize: 14 }}>
              Everything across all agents — {agents.length} agents active.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
              <Stat label="Total businesses" value={m.total} icon={Building2} tint={C.green} big />
              <Stat label="Deals won" value={m.won} icon={CheckCircle2} tint={C.greenBright} big />
              <Stat label="Conversion" value={m.convRate + "%"} icon={TrendingUp} tint={C.amber} big />
              <Stat label="Revenue (Le)" value={m.revenue.toLocaleString()} icon={DollarSign} tint={C.ink} big />
              <Stat label="Onboarded" value={m.onboarded} icon={UserCircle} tint={C.clay} big />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <Panel title="Agent leaderboard">
                <div style={{ display: "grid", gap: 8 }}>
                  {m.byAgent.map((a, i) => (
                    <div key={a.agent} style={{ display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", background: C.paper, borderRadius: 11 }}>
                      <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 15,
                        color: i === 0 ? C.greenBright : C.muted, width: 22 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{a.agent}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{a.total} logged · {a.won} won</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.green }}>Le {a.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Pipeline by stage">
                <div style={{ display: "grid", gap: 10 }}>
                  {m.byStage.map(s => {
                    const pct = m.total ? (s.n / m.total * 100) : 0;
                    return (
                      <div key={s.stage}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: C.ink, fontWeight: 500 }}>{s.stage}</span>
                          <span style={{ color: C.muted }}>{s.n}</span>
                        </div>
                        <div style={{ height: 8, background: C.paper, borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: STAGE_COLOR[s.stage],
                            borderRadius: 6, transition: "width .4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>

            {m.lostReasons.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Panel title="Why deals are lost">
                  <div style={{ display: "grid", gap: 8 }}>
                    {m.lostReasons.map(([reason, n]) => (
                      <div key={reason} style={{ display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", background: C.paper, borderRadius: 11 }}>
                        <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{reason}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#B0483C" }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </>
        ) : view === "all" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h1 style={h1Style}>All businesses</h1>
                <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 14 }}>{filtered.length} of {rows.length} shown</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ flex: "1 1 220px" }}><SearchBar q={q} setQ={setQ} placeholder="Search all businesses…" /></div>
              <Select value={fType} onChange={setFType} opts={["All", ...TYPES.map(t => t.key)]} />
              <Select value={fAgent} onChange={setFAgent} opts={["All", ...agents]} icon={UserCircle} />
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.length === 0 && <Empty text="No businesses match these filters." />}
              {filtered.map(r => <BizCard key={r.dbId} r={r} showAgent onClick={() => setDetail(r)} />)}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h1 style={h1Style}>Agents</h1>
                <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 14 }}>
                  {agentList.length} agent{agentList.length === 1 ? "" : "s"}. Add a new one to give them a login.</p>
              </div>
              <button onClick={() => setAddAgent(true)} style={primaryBtn}>
                <Plus size={17} strokeWidth={2.5} /> Add agent
              </button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {agentList.length === 0 && <Empty text="No agents yet. Add your first agent." />}
              {agentList.map(a => {
                const rs = rows.filter(r => r.agent === a.name);
                const won = rs.filter(r => r.stage === "Won").length;
                const revenue = rs.filter(r => r.stage === "Won").reduce((s, r) => s + (r.price || 0), 0);
                return (
                  <div key={a.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
                    padding: "15px 17px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: C.paper, flexShrink: 0,
                      display: "grid", placeItems: "center", color: C.green }}><UserCircle size={22} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{a.name}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                        <Mail size={12} /> {a.email}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12.5, color: C.muted }}>{rs.length} logged · {won} won</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.green, marginTop: 2 }}>Le {revenue.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {detail && <DetailModal row={detail} onClose={() => setDetail(null)} />}
      {addAgent && <AddAgentModal onClose={() => setAddAgent(false)} />}
    </>
  );
}
