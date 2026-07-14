import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, LogOut, Plus, Search, Phone, TrendingUp,
  CheckCircle2, Clock, X, Building2, DollarSign, Filter, ChevronRight,
  UserCircle, Store, Briefcase, Utensils, ArrowLeft, KeyRound, Mail, Hash
} from "lucide-react";

/* ============================ THEME ============================ */
const C = {
  ink: "#0B2E24",       // deep pine — text & dark surfaces
  green: "#128C7E",     // WhatsApp-teal — primary brand
  greenBright: "#25D366",// bright accent — success/close
  paper: "#F5F2EA",     // warm off-white bg
  card: "#FFFFFF",
  line: "#E4DFD2",
  clay: "#C9663A",      // signal accent for objections/attention
  amber: "#E0A030",
  muted: "#6B7A72",
};

const STAGES = ["New", "Interested", "Reluctant", "Absent", "Closed"];
const STAGE_COLOR = {
  New: "#8892A0", Interested: C.green, Reluctant: C.amber,
  Absent: C.clay, Closed: C.greenBright,
};
const TYPES = [
  { key: "Salon", icon: Store, price: 500 },
  { key: "Restaurant", icon: Utensils, price: 500 },
  { key: "Corporate", icon: Briefcase, price: 1500 },
];
const TYPE_ICON = { Salon: Store, Restaurant: Utensils, Corporate: Briefcase };

/* ============================ SEED DATA ============================ */
// Business ID format: GX-0001 — the key that links prospecting -> onboarding
let SEQ = 100;
const bid = () => `GX-${String(++SEQ).padStart(4, "0")}`;

const seed = [
  { id: bid(), name: "Chibex Hair", contact: "077883025", type: "Salon", stage: "Closed",
    objection: "Price high earlier", nextAction: "Onboarding Monday", agent: "Fiona",
    price: 300, onboarded: true,
    account: { ownerName: "Chibex", email: "chibex@mail.com", personalPhone: "077883025", password: "••••••" } },
  { id: bid(), name: "Beccy Salon", contact: "077688399", type: "Salon", stage: "Closed",
    objection: "Price high", nextAction: "Onboarding Wednesday", agent: "Beccy",
    price: 300, onboarded: false, account: null },
  { id: bid(), name: "Rugcess Beauty Bar", contact: "078932350", type: "Salon", stage: "Interested",
    objection: "Talking to husband tomorrow", nextAction: "Reach out tomorrow", agent: "Fiona",
    price: null, onboarded: false, account: null },
  { id: bid(), name: "MU Beauty", contact: "075521886", type: "Salon", stage: "Interested",
    objection: "Discuss as a whole", nextAction: "Reach this week", agent: "Musu Saffa",
    price: null, onboarded: false, account: null },
  { id: bid(), name: "Koslain Restaurant", contact: "076360200", type: "Restaurant", stage: "Absent",
    objection: "Manager absent", nextAction: "Reach out tomorrow", agent: "Rashida",
    price: null, onboarded: false, account: null },
  { id: bid(), name: "House of Beauty", contact: "076611021", type: "Salon", stage: "Reluctant",
    objection: "Maybe another time", nextAction: "Closed — lost", agent: "Musu Saffa",
    price: null, onboarded: false, account: null },
  { id: bid(), name: "MIRAG Beauty", contact: "077224981", type: "Salon", stage: "Interested",
    objection: "Will talk to husband today", nextAction: "Reach this week", agent: "Fiona",
    price: null, onboarded: false, account: null },
];

const AGENTS = ["Fiona", "Beccy", "Musu Saffa", "Rashida"];

/* ============================ ROOT ============================ */
export default function App() {
  const [session, setSession] = useState(null); // {role, name}
  const [rows, setRows] = useState(seed);

  if (!session) return <Login onLogin={setSession} />;
  return session.role === "admin"
    ? <AdminApp rows={rows} setRows={setRows} session={session} onLogout={() => setSession(null)} />
    : <AgentApp rows={rows} setRows={setRows} session={session} onLogout={() => setSession(null)} />;
}

/* ============================ LOGIN ============================ */
function Login({ onLogin }) {
  const [tab, setTab] = useState("agent");
  const [name, setName] = useState("Fiona");
  return (
    <Shell>
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
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Sales & Onboarding CRM</p>
          </div>

          <div style={{ background: C.card, borderRadius: 18, padding: 26,
            border: `1px solid ${C.line}`, boxShadow: "0 10px 40px rgba(11,46,36,.08)" }}>
            <div style={{ display: "flex", gap: 6, background: C.paper, padding: 5,
              borderRadius: 12, marginBottom: 22 }}>
              {["agent", "admin"].map(t => (
                <button key={t} onClick={() => { setTab(t); setName(t === "admin" ? "Diallo" : "Fiona"); }}
                  style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, cursor: "pointer",
                    fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                    background: tab === t ? C.card : "transparent",
                    color: tab === t ? C.ink : C.muted,
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,.06)" : "none" }}>
                    {t === "agent" ? "Sales Agent" : "Admin"}
                </button>
              ))}
            </div>

            <label style={lblStyle}>{tab === "admin" ? "Admin name" : "Your name"}</label>
            {tab === "agent" ? (
              <select value={name} onChange={e => setName(e.target.value)} style={inpStyle}>
                {AGENTS.map(a => <option key={a}>{a}</option>)}
              </select>
            ) : (
              <input value={name} onChange={e => setName(e.target.value)} style={inpStyle} />
            )}
            <label style={{ ...lblStyle, marginTop: 14 }}>Password</label>
            <input type="password" defaultValue="demo1234" style={inpStyle} />

            <button onClick={() => onLogin({ role: tab, name })}
              style={{ width: "100%", marginTop: 22, padding: "13px 0", border: "none",
                borderRadius: 11, background: C.green, color: "#fff", fontSize: 15,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(18,140,126,.3)" }}>
              Sign in {tab === "admin" ? "to dashboard" : "to log visits"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 16, marginBottom: 0 }}>
              {tab === "agent"
                ? "Agents see and manage only their own businesses."
                : "Admin sees every business, agent, and revenue metric."}
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ============================ AGENT APP ============================ */
function AgentApp({ rows, setRows, session, onLogout }) {
  const mine = rows.filter(r => r.agent === session.name);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);  // row or "new"
  const [onboard, setOnboard] = useState(null);   // row to onboard

  const filtered = mine.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const stats = {
    total: mine.length,
    interested: mine.filter(r => r.stage === "Interested").length,
    closed: mine.filter(r => r.stage === "Closed").length,
  };

  const saveRow = (row) => {
    setRows(prev => {
      if (row.id && prev.some(r => r.id === row.id)) return prev.map(r => r.id === row.id ? row : r);
      return [{ ...row, id: bid(), agent: session.name }, ...prev];
    });
    setEditing(null);
  };
  const saveOnboard = (row, account, price) => {
    setRows(prev => prev.map(r => r.id === row.id
      ? { ...r, onboarded: true, account, price, stage: "Closed" } : r));
    setOnboard(null);
  };

  return (
    <Shell>
      <TopBar session={session} onLogout={onLogout} subtitle="Field agent" />
      <div style={pageStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <h1 style={h1Style}>My pipeline</h1>
            <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 14 }}>
              Businesses you're working. Log a visit or close a deal.</p>
          </div>
          <button onClick={() => setEditing("new")} style={primaryBtn}>
            <Plus size={17} strokeWidth={2.5} /> Add business
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <Stat label="Total logged" value={stats.total} icon={Building2} tint={C.green} />
          <Stat label="Interested" value={stats.interested} icon={TrendingUp} tint={C.amber} />
          <Stat label="Closed" value={stats.closed} icon={CheckCircle2} tint={C.greenBright} />
        </div>

        <SearchBar q={q} setQ={setQ} placeholder="Search my businesses…" />

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {filtered.length === 0 && <Empty text="No businesses yet. Tap “Add business” after your next visit." />}
          {filtered.map(r => (
            <BizCard key={r.id} r={r} onClick={() => setEditing(r)}
              onOnboard={r.stage === "Closed" && !r.onboarded ? () => setOnboard(r) : null} />
          ))}
        </div>
      </div>

      {editing && <VisitModal row={editing === "new" ? null : editing}
        onClose={() => setEditing(null)} onSave={saveRow} />}
      {onboard && <OnboardModal row={onboard}
        onClose={() => setOnboard(null)} onSave={saveOnboard} />}
    </Shell>
  );
}

/* ============================ ADMIN APP ============================ */
function AdminApp({ rows, setRows, session, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("All");
  const [fAgent, setFAgent] = useState("All");
  const [detail, setDetail] = useState(null);

  const m = useMemo(() => {
    const closed = rows.filter(r => r.stage === "Closed");
    const revenue = closed.reduce((s, r) => s + (r.price || 0), 0);
    const byAgent = AGENTS.map(a => {
      const rs = rows.filter(r => r.agent === a);
      return { agent: a, total: rs.length, closed: rs.filter(r => r.stage === "Closed").length,
        revenue: rs.filter(r => r.stage === "Closed").reduce((s, r) => s + (r.price || 0), 0) };
    }).sort((x, y) => y.closed - x.closed);
    const byStage = STAGES.map(s => ({ stage: s, n: rows.filter(r => r.stage === s).length }));
    return { total: rows.length, closed: closed.length, revenue,
      onboarded: rows.filter(r => r.onboarded).length,
      convRate: rows.length ? Math.round(closed.length / rows.length * 100) : 0, byAgent, byStage };
  }, [rows]);

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) &&
    (fType === "All" || r.type === fType) &&
    (fAgent === "All" || r.agent === fAgent));

  return (
    <Shell>
      <TopBar session={session} onLogout={onLogout} subtitle="Admin"
        nav={<div style={{ display: "flex", gap: 4 }}>
          <NavBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={LayoutDashboard}>Dashboard</NavBtn>
          <NavBtn active={view === "all"} onClick={() => setView("all")} icon={Building2}>All businesses</NavBtn>
        </div>} />

      <div style={pageStyle}>
        {view === "dashboard" ? (
          <>
            <h1 style={h1Style}>Company overview</h1>
            <p style={{ color: C.muted, margin: "4px 0 22px", fontSize: 14 }}>
              Everything across all agents — {AGENTS.length} agents active.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
              <Stat label="Total businesses" value={m.total} icon={Building2} tint={C.green} big />
              <Stat label="Deals closed" value={m.closed} icon={CheckCircle2} tint={C.greenBright} big />
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
                        <div style={{ fontSize: 12, color: C.muted }}>{a.total} logged · {a.closed} closed</div>
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
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h1 style={h1Style}>All businesses</h1>
                <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 14 }}>{filtered.length} of {rows.length} shown</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ flex: "1 1 220px" }}><SearchBar q={q} setQ={setQ} placeholder="Search all businesses…" /></div>
              <Select value={fType} onChange={setFType} opts={["All", ...TYPES.map(t => t.key)]} icon={Filter} />
              <Select value={fAgent} onChange={setFAgent} opts={["All", ...AGENTS]} icon={UserCircle} />
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.length === 0 && <Empty text="No businesses match these filters." />}
              {filtered.map(r => <BizCard key={r.id} r={r} showAgent onClick={() => setDetail(r)} />)}
            </div>
          </>
        )}
      </div>
      {detail && <DetailModal row={detail} onClose={() => setDetail(null)} />}
    </Shell>
  );
}

/* ============================ MODALS ============================ */
function VisitModal({ row, onClose, onSave }) {
  const [f, setF] = useState(row || {
    name: "", contact: "", type: "Salon", stage: "New", objection: "", nextAction: "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.contact.trim();
  return (
    <Modal onClose={onClose} title={row ? "Update business" : "Log a new business"}
      badge={row?.id}>
      <Field label="Business name">
        <input style={inpStyle} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dolley Beauty" />
      </Field>
      <Row>
        <Field label="Contact number">
          <input style={inpStyle} value={f.contact} onChange={e => set("contact", e.target.value)} placeholder="07…" />
        </Field>
        <Field label="Business type">
          <select style={inpStyle} value={f.type} onChange={e => set("type", e.target.value)}>
            {TYPES.map(t => <option key={t.key}>{t.key}</option>)}
          </select>
        </Field>
      </Row>
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
      <Field label="Objection / note">
        <input style={inpStyle} value={f.objection} onChange={e => set("objection", e.target.value)} placeholder="What's holding them back?" />
      </Field>
      <Field label="Next action">
        <input style={inpStyle} value={f.nextAction} onChange={e => set("nextAction", e.target.value)} placeholder="e.g. Reach out Friday" />
      </Field>
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...primaryBtn, opacity: valid ? 1 : .5, pointerEvents: valid ? "auto" : "none" }}
          onClick={() => onSave({ ...row, ...f })}>Save</button>
      </ModalFooter>
    </Modal>
  );
}

function OnboardModal({ row, onClose, onSave }) {
  const defPrice = TYPES.find(t => t.key === row.type)?.price || 500;
  const [a, setA] = useState({ ownerName: "", email: "", personalPhone: row.contact, password: "" });
  const [price, setPrice] = useState(row.price || defPrice);
  const set = (k, v) => setA(p => ({ ...p, [k]: v }));
  const valid = a.ownerName.trim() && a.email.trim() && a.password.trim();
  return (
    <Modal onClose={onClose} title="Onboard — set up account" badge={row.id}
      accent={C.greenBright}>
      <div style={{ background: "rgba(37,211,102,.1)", border: `1px solid ${C.greenBright}44`,
        borderRadius: 11, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: C.ink }}>
        Setting up <b>{row.name}</b>. This account links to business ID <b>{row.id}</b>.
      </div>
      <Field label="Owner / contact name"><input style={inpStyle} value={a.ownerName}
        onChange={e => set("ownerName", e.target.value)} placeholder="Full name" /></Field>
      <Row>
        <Field label="Email"><input style={inpStyle} value={a.email}
          onChange={e => set("email", e.target.value)} placeholder="name@mail.com" /></Field>
        <Field label="Personal phone"><input style={inpStyle} value={a.personalPhone}
          onChange={e => set("personalPhone", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Password"><input type="password" style={inpStyle} value={a.password}
          onChange={e => set("password", e.target.value)} placeholder="Set login password" /></Field>
        <Field label="Agreed price (Le)"><input type="number" style={inpStyle} value={price}
          onChange={e => setPrice(Number(e.target.value))} /></Field>
      </Row>
      <ModalFooter>
        <button style={ghostBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...primaryBtn, background: C.greenBright, boxShadow: "0 4px 14px rgba(37,211,102,.35)",
          opacity: valid ? 1 : .5, pointerEvents: valid ? "auto" : "none" }}
          onClick={() => onSave(row, a, price)}>
          <CheckCircle2 size={17} strokeWidth={2.5} /> Complete onboarding
        </button>
      </ModalFooter>
    </Modal>
  );
}

function DetailModal({ row, onClose }) {
  const Icon = TYPE_ICON[row.type];
  return (
    <Modal onClose={onClose} title={row.name} badge={row.id}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={STAGE_COLOR[row.stage]}>{row.stage}</Tag>
          <Tag color={C.ink} soft><Icon size={13} /> {row.type}</Tag>
          <Tag color={C.green} soft><UserCircle size={13} /> {row.agent}</Tag>
          {row.onboarded && <Tag color={C.greenBright}><CheckCircle2 size={13} /> Onboarded</Tag>}
        </div>
        <Info icon={Phone} label="Contact" value={row.contact} />
        <Info icon={Clock} label="Objection / note" value={row.objection || "—"} />
        <Info icon={ChevronRight} label="Next action" value={row.nextAction || "—"} />
        <Info icon={DollarSign} label="Price" value={row.price ? `Le ${row.price}` : "Not set"} />

        {row.onboarded && row.account && (
          <div style={{ marginTop: 4, padding: 16, background: C.paper, borderRadius: 13 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase",
              letterSpacing: ".05em", marginBottom: 12 }}>Account details</div>
            <div style={{ display: "grid", gap: 10 }}>
              <Info icon={UserCircle} label="Owner" value={row.account.ownerName} />
              <Info icon={Mail} label="Email" value={row.account.email} />
              <Info icon={Phone} label="Personal phone" value={row.account.personalPhone} />
              <Info icon={KeyRound} label="Password" value={row.account.password} />
            </div>
          </div>
        )}
      </div>
      <ModalFooter><button style={primaryBtn} onClick={onClose}>Close</button></ModalFooter>
    </Modal>
  );
}

/* ============================ SHARED UI ============================ */
function Shell({ children }) {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.paper,
      minHeight: "100vh", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid ${C.green}; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid ${C.green}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 6px; }
      `}</style>
      {children}
    </div>
  );
}

function TopBar({ session, onLogout, subtitle, nav }) {
  return (
    <div style={{ background: C.ink, color: "#fff", position: "sticky", top: 0, zIndex: 20,
      boxShadow: "0 2px 20px rgba(11,46,36,.25)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "13px 22px",
        display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.green,
            display: "grid", placeItems: "center" }}><Phone size={16} color="#fff" strokeWidth={2.5} /></div>
          <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 18,
            letterSpacing: "-.02em" }}>geneline<span style={{ color: C.greenBright }}>-x</span></span>
        </div>
        {nav && <div style={{ marginLeft: 8 }}>{nav}</div>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{session.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{subtitle}</div>
          </div>
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

function NavBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 7,
      padding: "8px 13px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
      fontSize: 13.5, fontWeight: 600, background: active ? "rgba(37,211,102,.18)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,.6)" }}>
      <Icon size={16} /> {children}
    </button>
  );
}

function BizCard({ r, onClick, onOnboard, showAgent }) {
  const Icon = TYPE_ICON[r.type];
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.line}`,
      borderRadius: 14, padding: "15px 17px", cursor: "pointer", transition: "transform .12s, box-shadow .12s",
      display: "flex", alignItems: "center", gap: 14 }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(11,46,36,.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: C.paper, flexShrink: 0,
        display: "grid", placeItems: "center", color: C.green }}><Icon size={20} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{r.name}</span>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Archivo',sans-serif",
            fontWeight: 700, background: C.paper, padding: "2px 7px", borderRadius: 6 }}>{r.id}</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis" }}>
          <Phone size={12} style={{ display: "inline", verticalAlign: -1, marginRight: 4 }} />
          {r.contact}{r.objection ? ` · ${r.objection}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <Tag color={STAGE_COLOR[r.stage]}>{r.stage}</Tag>
        {showAgent && <span style={{ fontSize: 11.5, color: C.muted }}>{r.agent}</span>}
        {r.price && <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Le {r.price}</span>}
      </div>
      {onOnboard && (
        <button onClick={e => { e.stopPropagation(); onOnboard(); }} style={{ flexShrink: 0,
          display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10,
          border: "none", background: C.greenBright, color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", fontFamily: "inherit" }}>
          <UserCircle size={15} /> Onboard
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tint, big }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: big ? "17px 18px" : "14px 15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: tint + "18",
          display: "grid", placeItems: "center", color: tint }}><Icon size={16} /></div>
      </div>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: big ? 30 : 26,
        color: C.ink, marginTop: 6, letterSpacing: "-.02em" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15,
        color: C.ink, marginBottom: 15 }}>{title}</div>
      {children}
    </div>
  );
}

function SearchBar({ q, setQ, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={17} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
        style={{ ...inpStyle, paddingLeft: 40, marginBottom: 0 }} />
    </div>
  );
}

function Select({ value, onChange, opts, icon: Icon }) {
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

function Tag({ children, color, soft }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap",
      background: soft ? color + "14" : color, color: soft ? color : "#fff" }}>{children}</span>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <Icon size={16} style={{ color: C.muted, marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted,
      background: C.card, borderRadius: 14, border: `1px dashed ${C.line}` }}>
      <Building2 size={30} style={{ opacity: .4, marginBottom: 8 }} />
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

function Modal({ children, onClose, title, badge, accent = C.green }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,46,36,.5)",
      backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 24px 60px rgba(11,46,36,.35)" }}>
        <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 21,
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
        <div style={{ padding: "18px 22px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ children }) {
  return <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>{children}</div>;
}
function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={lblStyle}>{label}</label>{children}</div>;
}
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

/* ============================ STYLE TOKENS ============================ */
const pageStyle = { maxWidth: 1080, margin: "0 auto", padding: "26px 22px 60px" };
const h1Style = { fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 27,
  color: C.ink, margin: 0, letterSpacing: "-.025em" };
const lblStyle = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.muted, marginBottom: 6 };
const inpStyle = { width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`,
  fontSize: 14, fontFamily: "inherit", color: C.ink, background: "#fff", marginBottom: 0 };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 17px",
  borderRadius: 11, border: "none", background: C.green, color: "#fff", fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(18,140,126,.3)" };
const ghostBtn = { padding: "11px 17px", borderRadius: 11, border: `1.5px solid ${C.line}`,
  background: "#fff", color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
