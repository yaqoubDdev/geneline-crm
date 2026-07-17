"use client";

import { type CSSProperties, useMemo, useState } from "react";
import {
  Activity, Building2, CheckCircle2, DollarSign, LayoutDashboard, Mail, Plus, TrendingUp, Users, UserCircle, UserX,
} from "lucide-react";
import { C, h1Style, pageStyle, primaryBtn, STAGE_COLOR, STAGES, TYPES } from "@/lib/theme";
import type { Row } from "@/lib/types";
import { signOutAction } from "@/lib/actions";
import { BizCard, Empty, NavBtn, Panel, SearchBar, Select, Stat, TopBar } from "./ui";
import { AddAgentModal, DetailModal } from "./Modals";

type AgentInfo = { id: number; name: string; email: string };
type AgentProgress = {
  id: number; name: string; touchedToday: number; createdToday: number; target: number; metTarget: boolean;
};
type AuditEntry = {
  id: number; actorName: string; action: string;
  businessCode: string | null; businessName: string | null; details: string | null;
  createdAt: string | Date;
};

const STATUS_TINT: Record<string, string> = {
  Pending: "#8892A0", Active: C.greenBright, Paused: C.amber, Churned: "#B0483C",
};

const ACTION_LABEL: Record<string, string> = {
  create_business: "logged a new business",
  update_business: "updated",
  onboard_business: "onboarded",
  account_status_change: "changed status of",
  create_user: "added a user",
};

function timeAgo(when: string | Date): string {
  const d = typeof when === "string" ? new Date(when) : when;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

const DAILY_TARGET = 15;
const badge: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#fff", padding: "3px 8px", borderRadius: 999,
};

export default function AdminApp({
  rows, agentList, progress, audit, adminName,
}: { rows: Row[]; agentList: AgentInfo[]; progress: AgentProgress[]; audit: AuditEntry[]; adminName: string }) {
  const agents = agentList.map((a) => a.name);
  const [view, setView] = useState<"dashboard" | "monitoring" | "all" | "agents">("dashboard");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("All");
  const [fAgent, setFAgent] = useState("All");
  const [detail, setDetail] = useState<Row | null>(null);
  const [addAgent, setAddAgent] = useState(false);

  const m = useMemo(() => {
    const won = rows.filter(r => r.stage === "Won");
    // MRR = sum of monthly_fee across Active customers only.
    const isActive = (r: Row) => r.account?.status === "Active";
    const mrr = rows.filter(isActive).reduce((s, r) => s + (r.monthlyFee || 0), 0);
    const byAgent = agents.map(a => {
      const rs = rows.filter(r => r.agent === a);
      return {
        agent: a, total: rs.length, won: rs.filter(r => r.stage === "Won").length,
        mrr: rs.filter(isActive).reduce((s, r) => s + (r.monthlyFee || 0), 0),
      };
    }).sort((x, y) => y.mrr - x.mrr || y.won - x.won);
    const byStage = STAGES.map(s => ({ stage: s, n: rows.filter(r => r.stage === s).length }));
    const lostReasons = Object.entries(
      rows.filter(r => r.stage === "Lost").reduce<Record<string, number>>((acc, r) => {
        const key = r.lostReason?.trim() || "Unspecified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);
    const count = (st: string) => rows.filter(r => r.account?.status === st).length;
    const lifecycle = { Pending: count("Pending"), Active: count("Active"), Paused: count("Paused"), Churned: count("Churned") };
    const churnDenom = lifecycle.Active + lifecycle.Paused + lifecycle.Churned;
    const churnRate = churnDenom ? Math.round(lifecycle.Churned / churnDenom * 100) : 0;
    return {
      total: rows.length, won: won.length, mrr,
      onboarded: rows.filter(r => r.onboarded).length,
      convRate: rows.length ? Math.round(won.length / rows.length * 100) : 0,
      byAgent, byStage, lostReasons, lifecycle, churnRate,
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
          <NavBtn active={view === "monitoring"} onClick={() => setView("monitoring")} icon={Activity}>Monitoring</NavBtn>
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
              <Stat label="MRR (Le/mo)" value={m.mrr.toLocaleString()} icon={DollarSign} tint={C.ink} big />
              <Stat label="Active customers" value={m.lifecycle.Active} icon={UserCircle} tint={C.greenBright} big />
              <Stat label="Churned" value={m.lifecycle.Churned} icon={UserX} tint={C.clay} big />
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
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.green }}>Le {a.mrr.toLocaleString()}/mo</div>
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

            <div style={{ marginTop: 16 }}>
              <Panel title="Customer retention">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(["Active", "Pending", "Paused", "Churned"] as const).map(st => (
                    <div key={st} style={{ flex: "1 1 110px", background: C.paper, borderRadius: 11, padding: "12px 14px" }}>
                      <div style={{ fontSize: 12.5, color: C.muted }}>{st}</div>
                      <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 24,
                        color: STATUS_TINT[st], marginTop: 2 }}>{m.lifecycle[st]}</div>
                    </div>
                  ))}
                  <div style={{ flex: "1 1 110px", background: C.paper, borderRadius: 11, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12.5, color: C.muted }}>Churn</div>
                    <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 24,
                      color: "#B0483C", marginTop: 2 }}>{m.churnRate}%</div>
                  </div>
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
        ) : view === "monitoring" ? (
          <>
            <h1 style={h1Style}>Daily activity</h1>
            <p style={{ color: C.muted, margin: "4px 0 22px", fontSize: 14 }}>
              Each agent should talk to {DAILY_TARGET} businesses per day — new prospects or follow-ups. Resets at midnight.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 24 }}>
              {progress.length === 0 && <Empty text="No agents to monitor yet." />}
              {progress.map((p) => {
                const pct = Math.min(100, Math.round((p.touchedToday / p.target) * 100));
                const tint = p.metTarget ? C.greenBright : pct >= 60 ? C.amber : C.clay;
                return (
                  <div key={p.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "15px 17px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{p.name}</span>
                      {p.metTarget
                        ? <span style={{ ...badge, background: C.greenBright }}>Target met</span>
                        : <span style={{ ...badge, background: tint }}>{p.target - p.touchedToday} to go</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 30, color: tint }}>{p.touchedToday}</span>
                      <span style={{ fontSize: 14, color: C.muted }}>/ {p.target} businesses</span>
                    </div>
                    <div style={{ height: 8, background: C.paper, borderRadius: 6, overflow: "hidden", margin: "10px 0 6px" }}>
                      <div style={{ width: pct + "%", height: "100%", background: tint, borderRadius: 6, transition: "width .4s" }} />
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{p.createdToday} new · {p.touchedToday - p.createdToday} follow-ups</div>
                  </div>
                );
              })}
            </div>

            <Panel title="Activity feed">
              {audit.length === 0
                ? <Empty text="No activity logged yet." />
                : <div style={{ display: "grid", gap: 2 }}>
                    {audit.map((a) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: `1px solid ${C.line}` }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.paper, flexShrink: 0, display: "grid", placeItems: "center", color: C.green }}>
                          <Activity size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: C.ink }}>
                          <b>{a.actorName}</b> {ACTION_LABEL[a.action] ?? a.action}
                          {a.businessName ? <> <span style={{ color: C.green }}>{a.businessName}</span></> : null}
                          {a.businessCode ? <span style={{ color: C.muted }}> ({a.businessCode})</span> : null}
                          {a.details ? <span style={{ color: C.muted }}> — {a.details}</span> : null}
                        </div>
                        <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{timeAgo(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>}
            </Panel>
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
                const mrr = rs.filter(r => r.account?.status === "Active").reduce((s, r) => s + (r.monthlyFee || 0), 0);
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
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.green, marginTop: 2 }}>Le {mrr.toLocaleString()}/mo</div>
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
