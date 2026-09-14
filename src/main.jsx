import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Check,
  ChartBar,
  Gear,
  House,
  Minus,
  Plus,
  SignOut,
  UserCircle,
  UsersThree,
  DownloadSimple,
  ArrowClockwise,
} from "@phosphor-icons/react";
import "./styles.css";

const EMPLOYEES = [
  { id: "hansen", name: "Hansen", role: "admin" },
  { id: "alex", name: "Alex", role: "employee" },
  { id: "jason", name: "Jason", role: "employee" },
  { id: "amy", name: "Amy", role: "employee" },
];
const ZONES = ["iPhone", "Mac", "iPad", "Apple Watch"];
const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      )
    : null;

function seed() {
  let out = [];
  for (let d = 0; d < 14; d++) {
    for (let e = 0; e < 4; e++) {
      if ((d + e) % 3 === 0) continue;
      out.push({
        id: `demo-${d}-${e}`,
        employee_name: EMPLOYEES[e].name,
        zone: ZONES[(d + e) % 4],
        date: new Date(Date.now() - d * 864e5).toISOString().slice(0, 10),
        convert_count: (d + e) % 4,
        p1_lead_count: (d + e) % 3,
        session_recap_count: 1 + (d % 3),
        start_time: null,
        end_time: null,
        created_at: new Date(Date.now() - d * 864e5).toISOString(),
      });
    }
  }
  return out;
}

function App() {
  const [employee, setEmployee] = useState(
    () => localStorage.getItem("ld_employee") || "",
  );
  const [view, setView] = useState("record");
  const [records, setRecords] = useState(seed);
  const [zone, setZone] = useState("iPhone");
  const [counts, setCounts] = useState({ convert: 0, p1: 0, recap: 0 });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const current = EMPLOYEES.find((e) => e.id === employee);
  const isAdmin = current?.role === "admin";
  useEffect(() => {
    if (employee) localStorage.setItem("ld_employee", employee);
  }, [employee]);
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) await supabase.auth.signInAnonymously();
      const { data } = await supabase
        .from("performance_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data?.length) setRecords(data);
    })().catch((err) => console.error("Supabase bootstrap failed", err));
  }, []);
  const submit = async () => {
    if (!employee || saving) return;
    setSaving(true);
    setStatus("");
    const now = new Date();
    const payload = {
      employee_name: current.name,
      zone,
      date: now.toISOString().slice(0, 10),
      convert_count: counts.convert,
      p1_lead_count: counts.p1,
      session_recap_count: counts.recap,
      start_time: null,
      end_time: now.toISOString(),
    };
    try {
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Auth session unavailable");
        const { data, error } = await supabase
          .from("performance_records")
          .insert({ user_id: session.user.id, ...payload })
          .select()
          .single();
        if (error) throw error;
        setRecords((r) => [data, ...r]);
      } else {
        setRecords((r) => [
          {
            id: crypto.randomUUID(),
            ...payload,
            created_at: now.toISOString(),
          },
          ...r,
        ]);
      }
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };
  const reset = () => {
    setCounts({ convert: 0, p1: 0, recap: 0 });
    setStatus("");
  };
  if (!employee) return <Welcome onChoose={setEmployee} />;
  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="brand-mark">LD</span>
          <div>
            <div className="eyebrow">LIVE DEMO</div>
            <div className="brand-name">Performance Tracker</div>
          </div>
        </div>
        <button
          className="switch"
          onClick={() => {
            localStorage.removeItem("ld_employee");
            setEmployee("");
          }}
        >
          <SignOut size={18} /> 切换用户
        </button>
      </header>
      <main>
        {view === "record" ? (
          <Record
            current={current}
            zone={zone}
            setZone={setZone}
            counts={counts}
            setCounts={setCounts}
            submit={submit}
            saving={saving}
            status={status}
            reset={reset}
          />
        ) : (
          <Dashboard records={records} current={current} isAdmin={isAdmin} />
        )}
      </main>
      <nav className="bottom-nav">
        <button
          className={view === "record" ? "active" : ""}
          onClick={() => setView("record")}
        >
          <House size={22} />
          <span>Record</span>
        </button>
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => setView("dashboard")}
        >
          <ChartBar size={22} />
          <span>{isAdmin ? "Team" : "My"} dashboard</span>
        </button>
      </nav>
    </div>
  );
}

function Welcome({ onChoose }) {
  return (
    <div className="welcome">
      <div className="welcome-card">
        <span className="brand-mark large">LD</span>
        <div className="eyebrow">LIVE DEMO</div>
        <h1>
          Performance
          <br />
          <em>Tracker</em>
        </h1>
        <p className="muted">
          每次 Zoning 结束后，更快完成记录。
        </p>
        <label>你是谁？</label>
        <div className="people">
          {EMPLOYEES.map((e) => (
            <button key={e.id} onClick={() => onChoose(e.id)}>
              <UserCircle size={21} />
              {e.name}
              <span>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange }) {
  return (
    <div className="metric">
      <div>
        <span className="metric-label">{label}</span>
        <span className="metric-hint">每个 Zoning</span>
      </div>
      <div className="stepper">
        <button
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus size={18} />
        </button>
        <strong>{value}</strong>
        <button
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(99, value + 1))}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
function Record({
  current,
  zone,
  setZone,
  counts,
  setCounts,
  submit,
  saving,
  status,
  reset,
}) {
  return (
    <div className="record-page">
      <div className="greeting">
        <div>
          <div className="eyebrow">READY TO LOG</div>
          <h2>Hi, {current.name}</h2>
        </div>
        <span className="today">
          {new Intl.DateTimeFormat("en", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(new Date())}
        </span>
      </div>
      <section className="panel">
        <label className="section-label">你在哪个 Zoning</label>
        <div className="zone-grid">
          {ZONES.map((z) => (
            <button
              key={z}
              className={zone === z ? "selected" : ""}
              onClick={() => setZone(z)}
            >
              {z}
            </button>
          ))}
        </div>
      </section>
      <section className="panel metrics">
        <label className="section-label">Performance</label>
        <Stepper
          label="Convert"
          value={counts.convert}
          onChange={(v) => setCounts({ ...counts, convert: v })}
        />
        <Stepper
          label="P1 Lead"
          value={counts.p1}
          onChange={(v) => setCounts({ ...counts, p1: v })}
        />
        <Stepper
          label="Session Recap"
          value={counts.recap}
          onChange={(v) => setCounts({ ...counts, recap: v })}
        />
      </section>
      <button className="submit" disabled={saving} onClick={submit}>
        {saving ? (
          "Saving…"
        ) : status === "success" ? (
          <>
            <Check size={22} /> Recorded
          </>
        ) : (
          "Submit zone"
        )}
      </button>
      {status === "success" && (
        <div className="feedback success">
          <Check size={18} />
          <div>
            <strong>Recorded</strong>
            <span>
              {current.name} · {zone} ·{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <button onClick={reset}>Record another</button>
        </div>
      )}
      {status === "error" && (
        <div className="feedback error">
          Unable to save. Your data is still here.{" "}
          <button onClick={submit}>Try again</button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ records, current, isAdmin }) {
  const [period, setPeriod] = useState("Today");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [range, setRange] = useState({ from: "", to: "" });
  const today = new Date();
  const start =
    period === "Today"
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
      : period === "This Week"
        ? new Date(today - 6 * 864e5)
        : period === "This Month"
          ? new Date(today.getFullYear(), today.getMonth(), 1)
          : new Date(range.from || 0);
  const filtered = records.filter(
    (r) =>
      (isAdmin || r.employee_name === current.name) &&
      (!isAdmin ||
        employeeFilter === "All" ||
        r.employee_name === employeeFilter) &&
      (zoneFilter === "All" || r.zone === zoneFilter) &&
      (period === "Custom Range"
        ? r.date >= (range.from || "0000") && r.date <= (range.to || "9999")
        : new Date(r.date) >= start),
  );
  const totals = filtered.reduce(
    (a, r) => ({
      convert: a.convert + r.convert_count,
      p1: a.p1 + r.p1_lead_count,
      recap: a.recap + r.session_recap_count,
      zones: a.zones + 1,
    }),
    { convert: 0, p1: 0, recap: 0, zones: 0 },
  );
  const people = isAdmin
    ? EMPLOYEES
    : EMPLOYEES.filter((e) => e.id === current.id);
  const exportCsv = () => {
    const rows = [
      [
        "Date",
        "Employee",
        "Zone",
        "Start Time",
        "End Time",
        "Convert",
        "P1 Lead",
        "Session Recap",
        "Created At",
      ],
      ...filtered.map((r) => [
        r.date,
        r.employee_name,
        r.zone,
        r.start_time || "",
        r.end_time || "",
        r.convert_count,
        r.p1_lead_count,
        r.session_recap_count,
        r.created_at,
      ]),
    ];
    const blob = new Blob([rows.map((x) => x.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "live-demo-performance.csv";
    a.click();
  };
  return (
    <div className="dashboard">
      <div className="dash-head">
        <div>
          <div className="eyebrow">
            {isAdmin ? "TEAM PERFORMANCE" : "MY PERFORMANCE"}
          </div>
          <h2>{isAdmin ? "团队概览" : "Your numbers"}</h2>
        </div>
        {isAdmin && (
          <button className="icon-btn" onClick={exportCsv}>
            <DownloadSimple size={20} />
            <span>导出 CSV</span>
          </button>
        )}
      </div>
      <div className="filters">
        <div className="segmented">
          {[ ["Today", "今天"], ["This Week", "本周"], ["This Month", "本月"], ["Custom Range", "自定义范围"] ].map(([p, label]) => (
            <button
              className={period === p ? "active" : ""}
              onClick={() => setPeriod(p)}
              key={p}
            >
              {label}
            </button>
          ))}
        </div>
        {period === "Custom Range" && (
          <div className="date-row">
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
            />
          </div>
        )}
        {isAdmin && (
          <div className="filter-row">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option>All</option>
              {EMPLOYEES.map((e) => (
                <option key={e.id}>{e.name}</option>
              ))}
            </select>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option>All</option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <section className="total-card">
        <span className="section-label">
          {isAdmin ? "TEAM TOTAL" : "TOTAL"}
        </span>
        <div className="totals">
          <div>
            <strong>{totals.convert}</strong>
            <span>Convert</span>
          </div>
          <div>
            <strong>{totals.p1}</strong>
            <span>P1 Lead</span>
          </div>
          <div>
            <strong>{totals.recap}</strong>
            <span>Recap</span>
          </div>
          <div>
            <strong>{totals.zones}</strong>
            <span>Zones</span>
          </div>
        </div>
      </section>
      <section className="members">
        <div className="section-label">
          {isAdmin ? "TEAM MEMBERS" : "RECENT ZONES"}
        </div>
        {isAdmin
          ? people.map((p) => {
              const rs = filtered.filter((r) => r.employee_name === p.name);
              const t = rs.reduce(
                (a, r) => ({
                  c: a.c + r.convert_count,
                  p: a.p + r.p1_lead_count,
                  re: a.re + r.session_recap_count,
                }),
                { c: 0, p: 0, re: 0 },
              );
              return (
                <div className="member" key={p.id}>
                  <div className="avatar">{p.name[0]}</div>
                  <div className="member-main">
                    <strong>{p.name}</strong>
                    <div className="member-stats">
                      <span>{t.c} convert</span>
                      <span>{t.p} P1</span>
                      <span>{t.re} recap</span>
                    </div>
                  </div>
                  <div className="avg">
                    {rs.length ? (t.c / rs.length).toFixed(2) : "0.00"}
                    <small>avg / zone</small>
                  </div>
                </div>
              );
            })
          : filtered.slice(0, 8).map((r) => (
              <div className="member" key={r.id}>
                <div className="avatar">{r.zone[0]}</div>
                <div className="member-main">
                  <strong>{r.zone}</strong>
                  <div className="member-stats">
                    <span>{r.convert_count} convert</span>
                    <span>{r.p1_lead_count} P1</span>
                    <span>{r.session_recap_count} recap</span>
                  </div>
                </div>
                <time>{r.date}</time>
              </div>
            ))}
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
