/**
 * WealthPulse — Personal Finance Dashboard
 * ==========================================
 * A single-page React application for tracking expenses and exploring
 * investment fund options. All data is in-memory; refresh resets to
 * seeded demo state.
 *
 * Login credentials:  demo / demo123
 *
 * Tech stack: React 18 + Tailwind CSS + Recharts
 */

import { useState, useReducer, useContext, createContext, useMemo, useCallback, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  CartesianGrid, RadialBarChart, RadialBar
} from "recharts";

/* ──────────────────────────────────────────────
   SECTION 1 — SEED DATA GENERATORS
   ────────────────────────────────────────────── */

const CATEGORIES = ["Housing","Food","Transport","Entertainment","Health","Utilities","Shopping","Subscriptions"];
const CAT_ICONS = { Housing:"🏠", Food:"🍽️", Transport:"🚗", Entertainment:"🎬", Health:"💊", Utilities:"⚡", Shopping:"🛍️", Subscriptions:"📺" };
const CAT_COLORS = { Housing:"#6366f1", Food:"#f59e0b", Transport:"#3b82f6", Entertainment:"#ec4899", Health:"#10b981", Utilities:"#8b5cf6", Shopping:"#f97316", Subscriptions:"#14b8a6" };

/** Generate realistic seeded transactions for 3 months */
function generateTransactions() {
  const descs = {
    Housing: ["Rent payment","Home insurance","Maintenance fee","Cleaning service","Property tax installment"],
    Food: ["Whole Foods","Trader Joe's","Restaurant dinner","Coffee shop","Lunch delivery","Grocery run","Bakery","Sushi takeout"],
    Transport: ["Gas station","Uber ride","Metro pass","Parking garage","Car wash","Toll fees","Lyft ride"],
    Entertainment: ["Movie tickets","Concert tickets","Streaming service","Book purchase","Museum entry","Game purchase"],
    Health: ["Pharmacy","Gym membership","Doctor copay","Vitamins","Dental visit","Eye exam"],
    Utilities: ["Electric bill","Water bill","Internet","Phone bill","Gas bill"],
    Shopping: ["Amazon order","Clothing store","Electronics","Home decor","Gift purchase","Shoe store"],
    Subscriptions: ["Netflix","Spotify","Cloud storage","News subscription","Software license","Meal kit"]
  };
  const ranges = { Housing:[1200,1800], Food:[8,120], Transport:[5,80], Entertainment:[10,60], Health:[15,200], Utilities:[30,150], Shopping:[15,250], Subscriptions:[8,50] };
  const txns = [];
  let id = 1;
  // Generate for Jan, Feb, Mar 2026
  [0,1,2].forEach(mi => {
    const year = 2026, month = mi; // 0=Jan,1=Feb,2=Mar
    const daysInMonth = new Date(year, month+1, 0).getDate();
    // Each category gets a few transactions per month
    CATEGORIES.forEach(cat => {
      const count = cat === "Housing" ? 1 : cat === "Utilities" ? 2 : cat === "Subscriptions" ? 2 : Math.floor(Math.random()*4)+2;
      for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random()*daysInMonth)+1;
        const [lo,hi] = ranges[cat];
        const amount = +(lo + Math.random()*(hi-lo)).toFixed(2);
        const desc = descs[cat][Math.floor(Math.random()*descs[cat].length)];
        txns.push({ id: id++, date: `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`, description: desc, amount, category: cat });
      }
    });
  });
  return txns.sort((a,b) => b.date.localeCompare(a.date));
}

/** 6 sample investment funds with 12 months of historical returns */
const FUNDS = [
  { id:"uslc", name:"US Large Cap Index", type:"Index", risk:"Medium", expenseRatio:0.03, monthlyReturns:[1.2,0.8,-0.5,1.5,2.0,0.3,-1.0,1.8,0.6,1.1,-0.3,1.4] },
  { id:"intl", name:"International Equity", type:"Equity", risk:"High", expenseRatio:0.12, monthlyReturns:[0.9,-0.7,1.3,0.5,1.8,-1.2,2.1,0.4,-0.8,1.6,0.7,1.0] },
  { id:"bond", name:"Bond Fund", type:"Fixed Income", risk:"Low", expenseRatio:0.05, monthlyReturns:[0.3,0.4,0.2,0.5,0.3,0.4,0.2,0.3,0.5,0.4,0.3,0.2] },
  { id:"tech", name:"Tech Growth", type:"Sector", risk:"High", expenseRatio:0.15, monthlyReturns:[2.5,1.2,-2.0,3.1,1.5,-0.8,2.8,-1.5,2.0,1.8,-0.5,3.0] },
  { id:"reit", name:"Real Estate REIT", type:"Real Estate", risk:"Medium", expenseRatio:0.08, monthlyReturns:[0.8,0.5,0.9,-0.3,1.2,0.6,0.4,1.0,-0.2,0.7,0.8,0.5] },
  { id:"emrg", name:"Emerging Markets", type:"Equity", risk:"High", expenseRatio:0.18, monthlyReturns:[1.5,-1.0,2.0,-0.5,1.8,-1.5,2.5,0.3,-0.7,1.9,1.2,-0.8] },
];

const MONTHLY_INCOME = 6500;
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ──────────────────────────────────────────────
   SECTION 2 — APP STATE (useReducer + Context)
   ────────────────────────────────────────────── */

const AppContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: { name: "Alex Morgan", email: "alex@wealthpulse.demo", currency: "USD", avatar: "AM" },
  transactions: generateTransactions(),
  budgets: { Housing:2000, Food:600, Transport:300, Entertainment:200, Health:300, Utilities:400, Shopping:400, Subscriptions:150 },
  // Investment explorer state
  selectedFunds: [],        // up to 3 fund ids for comparison
  portfolioAlloc: {},       // { fundId: percentage }
  // UI state
  activeTab: "dashboard",
  selectedMonth: 2, // March (0-indexed)
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN": return { ...state, isAuthenticated: true };
    case "LOGOUT": return { ...initialState, transactions: generateTransactions() };
    case "SET_TAB": return { ...state, activeTab: action.payload };
    case "SET_MONTH": return { ...state, selectedMonth: action.payload };
    case "ADD_TRANSACTION": return { ...state, transactions: [action.payload, ...state.transactions].sort((a,b) => b.date.localeCompare(a.date)) };
    case "SET_BUDGET": return { ...state, budgets: { ...state.budgets, [action.payload.category]: action.payload.amount } };
    case "UPDATE_PROFILE": return { ...state, user: { ...state.user, ...action.payload } };
    case "TOGGLE_FUND": {
      const id = action.payload;
      const sel = state.selectedFunds.includes(id) ? state.selectedFunds.filter(f=>f!==id) : state.selectedFunds.length < 3 ? [...state.selectedFunds, id] : state.selectedFunds;
      return { ...state, selectedFunds: sel };
    }
    case "SET_PORTFOLIO": return { ...state, portfolioAlloc: action.payload };
    default: return state;
  }
}

/* ──────────────────────────────────────────────
   SECTION 3 — UTILITY FUNCTIONS
   ────────────────────────────────────────────── */

const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

function getMonthTransactions(txns, monthIdx) {
  const m = String(monthIdx+1).padStart(2,"0");
  return txns.filter(t => t.date.startsWith(`2026-${m}`));
}

function getCategoryTotal(txns, cat) {
  return txns.filter(t=>t.category===cat).reduce((s,t)=>s+t.amount,0);
}

function getFundReturn(fund, months) {
  const slice = fund.monthlyReturns.slice(-months);
  return slice.reduce((acc, r) => acc * (1 + r/100), 1) - 1;
}

/* ──────────────────────────────────────────────
   SECTION 4 — SHARED UI COMPONENTS
   ────────────────────────────────────────────── */

/** Glassmorphism card wrapper */
function Card({ children, className = "", onClick }) {
  return (
    <div onClick={onClick} className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 ${className}`}>
      {children}
    </div>
  );
}

/** Stat card for dashboard KPIs */
function StatCard({ label, value, sub, positive, icon }) {
  return (
    <Card className="flex items-start gap-3 hover:border-white/10 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${positive === true ? "bg-emerald-500/15 text-emerald-400" : positive === false ? "bg-red-500/15 text-red-400" : "bg-indigo-500/15 text-indigo-400"}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5 truncate">{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-slate-400"}`}>{sub}</p>}
      </div>
    </Card>
  );
}

/** Custom Recharts tooltip */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/95 border border-white/10 rounded-lg px-3 py-2 shadow-xl backdrop-blur text-xs">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/** Search input */
function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition" />
    </div>
  );
}

/* ──────────────────────────────────────────────
   SECTION 5 — LOGIN SCREEN
   Credentials: demo / demo123
   ────────────────────────────────────────────── */

function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => { setTimeout(() => setShow(true), 50); }, []);

  const handleSubmit = () => {
    if (user === "demo" && pass === "demo123") { onLogin(); }
    else { setError("Invalid credentials. Use demo / demo123"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay:"1s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[100px]" />
      </div>
      <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <Card className="p-8 !border-white/[0.08]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily:"'Outfit', sans-serif"}}>WealthPulse</h1>
            <p className="text-slate-500 text-sm mt-1">Personal Finance Dashboard</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5 block">Username</label>
              <input value={user} onChange={e=>{setUser(e.target.value);setError("");}} placeholder="demo"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1.5 block">Password</label>
              <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("");}} placeholder="demo123"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button onClick={handleSubmit}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
              Sign In
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-6">Credentials: <span className="text-slate-400">demo</span> / <span className="text-slate-400">demo123</span></p>
        </Card>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   SECTION 6 — SIDEBAR NAVIGATION
   ────────────────────────────────────────────── */

function Sidebar({ activeTab, setTab, collapsed, setCollapsed, user, onLogout }) {
  const items = [
    { id:"dashboard", label:"Dashboard", icon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/> },
    { id:"expenses", label:"Expenses", icon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/> },
    { id:"investments", label:"Investments", icon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/> },
    { id:"budgets", label:"Budgets", icon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/> },
    { id:"settings", label:"Settings", icon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>, icon2:<circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/> },
  ];

  return (
    <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-2xl transition-all duration-300 ${collapsed ? "w-[68px]" : "w-60"}`}>
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </div>
        {!collapsed && <span className="text-white font-bold text-lg tracking-tight" style={{fontFamily:"'Outfit', sans-serif"}}>WealthPulse</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id
                ? "bg-emerald-500/10 text-emerald-400 shadow-inner shadow-emerald-500/5"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}>
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}{item.icon2}</svg>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle + user */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.04] text-xs transition">
          <svg className={`w-4 h-4 transition-transform ${collapsed?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
          {!collapsed && "Collapse"}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-sm transition">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}

/* ──────────────────────────────────────────────
   SECTION 7 — DASHBOARD (Overview)
   ────────────────────────────────────────────── */

function DashboardTab() {
  const { state } = useContext(AppContext);
  const { transactions, selectedMonth, budgets } = state;

  const monthTxns = useMemo(() => getMonthTransactions(transactions, selectedMonth), [transactions, selectedMonth]);
  const prevTxns = useMemo(() => selectedMonth > 0 ? getMonthTransactions(transactions, selectedMonth - 1) : [], [transactions, selectedMonth]);

  const totalSpent = monthTxns.reduce((s,t) => s+t.amount, 0);
  const prevSpent = prevTxns.reduce((s,t) => s+t.amount, 0);
  const netSavings = MONTHLY_INCOME - totalSpent;
  const prevSavings = selectedMonth > 0 ? MONTHLY_INCOME - prevSpent : 0;
  const spentChange = prevSpent ? ((totalSpent - prevSpent)/prevSpent*100) : 0;

  // Category breakdown for donut
  const catData = CATEGORIES.map(c => ({ name: c, value: +getCategoryTotal(monthTxns, c).toFixed(2), color: CAT_COLORS[c] })).filter(d => d.value > 0);

  // Daily cumulative spending
  const dailyCum = useMemo(() => {
    const daysInMonth = new Date(2026, selectedMonth+1, 0).getDate();
    const dayTotals = {};
    monthTxns.forEach(t => { const d = parseInt(t.date.slice(-2)); dayTotals[d] = (dayTotals[d]||0) + t.amount; });
    let cum = 0;
    return Array.from({length:daysInMonth}, (_,i) => { cum += (dayTotals[i+1]||0); return { day: i+1, amount: +cum.toFixed(2) }; });
  }, [monthTxns, selectedMonth]);

  // 3-month comparison bar chart
  const monthlyComparison = [0,1,2].map(m => ({
    month: SHORT_MONTHS[m],
    total: +getMonthTransactions(transactions, m).reduce((s,t)=>s+t.amount,0).toFixed(2),
    income: MONTHLY_INCOME
  }));

  // Budget alerts
  const budgetAlerts = CATEGORIES.map(cat => {
    const spent = getCategoryTotal(monthTxns, cat);
    const budget = budgets[cat] || 0;
    const pct = budget ? (spent/budget*100) : 0;
    return { cat, spent, budget, pct };
  }).filter(b => b.pct > 50).sort((a,b) => b.pct - a.pct).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white" style={{fontFamily:"'Outfit', sans-serif"}}>Overview</h2>
        <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          {[0,1,2].map(m => (
            <MonthButton key={m} m={m} />
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Income" value={fmt(MONTHLY_INCOME)} icon="💰" />
        <StatCard label="Total Spent" value={fmt(totalSpent)} sub={`${spentChange >= 0 ? "↑" : "↓"} ${Math.abs(spentChange).toFixed(1)}% vs last month`} positive={spentChange <= 0} icon="💸" />
        <StatCard label="Net Savings" value={fmt(netSavings)} sub={selectedMonth > 0 ? `${netSavings >= prevSavings ? "↑" : "↓"} ${fmt(Math.abs(netSavings - prevSavings))}` : undefined} positive={netSavings > 0} icon="🏦" />
        <StatCard label="Transactions" value={monthTxns.length} sub={`across ${catData.length} categories`} icon="📊" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut chart - spending by category */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                {catData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {catData.map(d => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{background:d.color}} />{d.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Line chart - daily cumulative */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Cumulative Spending</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyCum}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#cumGrad)" name="Spent" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar chart - monthly comparison */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyComparison} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Bar dataKey="total" fill="#6366f1" radius={[6,6,0,0]} name="Spending" />
              <Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]} name="Income" opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Budget Alerts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgetAlerts.map(b => (
              <div key={b.cat} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <span className="text-lg">{CAT_ICONS[b.cat]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{b.cat}</span>
                    <span className={b.pct > 90 ? "text-red-400" : b.pct > 70 ? "text-amber-400" : "text-slate-400"}>{fmt(b.spent)} / {fmt(b.budget)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${b.pct > 90 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : b.pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{width:`${Math.min(b.pct,100)}%`}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Transactions</h3>
        <div className="space-y-1">
          {monthTxns.slice(0, 8).map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition">
              <span className="text-base">{CAT_ICONS[t.category]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{t.description}</p>
                <p className="text-[10px] text-slate-500">{t.category} · {t.date}</p>
              </div>
              <span className="text-sm font-semibold text-red-400 tabular-nums">-{fmt(t.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Month selector button (used in dashboard) */
function MonthButton({ m }) {
  const { state, dispatch } = useContext(AppContext);
  return (
    <button
      onClick={() => dispatch({type:"SET_MONTH", payload:m})}
      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${state.selectedMonth === m ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"}`}>
      {SHORT_MONTHS[m]}
    </button>
  );
}

/* ──────────────────────────────────────────────
   SECTION 8 — EXPENSES TAB
   ────────────────────────────────────────────── */

function ExpensesTab() {
  const { state, dispatch } = useContext(AppContext);
  const { transactions, selectedMonth } = state;

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date"); // date | amount | category
  const [sortDir, setSortDir] = useState("desc");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fDate, setFDate] = useState(`2026-${String(selectedMonth+1).padStart(2,"0")}-15`);
  const [fDesc, setFDesc] = useState("");
  const [fAmt, setFAmt] = useState("");
  const [fCat, setFCat] = useState("Food");

  const monthTxns = useMemo(() => getMonthTransactions(transactions, selectedMonth), [transactions, selectedMonth]);

  const filtered = useMemo(() => {
    let list = [...monthTxns];
    if (catFilter !== "All") list = list.filter(t => t.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.date.includes(q));
    }
    list.sort((a,b) => {
      if (sortBy === "date") return sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
      if (sortBy === "amount") return sortDir === "desc" ? b.amount - a.amount : a.amount - b.amount;
      return sortDir === "desc" ? b.category.localeCompare(a.category) : a.category.localeCompare(b.category);
    });
    return list;
  }, [monthTxns, catFilter, search, sortBy, sortDir]);

  const handleAdd = () => {
    if (!fDesc || !fAmt) return;
    dispatch({ type: "ADD_TRANSACTION", payload: {
      id: Date.now(), date: fDate, description: fDesc, amount: parseFloat(fAmt), category: fCat
    }});
    setFDesc(""); setFAmt(""); setShowForm(false);
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }) => (
    <svg className={`w-3 h-3 inline ml-1 ${sortBy === field ? "text-emerald-400" : "text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === field && sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
    </svg>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white" style={{fontFamily:"'Outfit', sans-serif"}}>Expenses</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            {[0,1,2].map(m => <MonthButton key={m} m={m} />)}
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Expense
          </button>
        </div>
      </div>

      {/* Add expense form */}
      {showForm && (
        <Card className="!border-emerald-500/20">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">New Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50" />
            <input value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Description"
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
            <input type="number" value={fAmt} onChange={e=>setFAmt(e.target.value)} placeholder="Amount" step="0.01"
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
            <select value={fCat} onChange={e=>setFCat(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50">
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
            </select>
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">
              Save
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search transactions…" />
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50">
          <option value="All" className="bg-slate-800">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
        </select>
      </div>

      {/* Transaction table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer select-none" onClick={()=>toggleSort("date")}>Date<SortIcon field="date" /></th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Description</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer select-none" onClick={()=>toggleSort("category")}>Category<SortIcon field="category" /></th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer select-none" onClick={()=>toggleSort("amount")}>Amount<SortIcon field="amount" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3 text-slate-400 tabular-nums whitespace-nowrap">{t.date}</td>
                  <td className="px-5 py-3 text-white">{t.description}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{background:`${CAT_COLORS[t.category]}15`, color: CAT_COLORS[t.category]}}>
                      {CAT_ICONS[t.category]} {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-red-400 font-semibold tabular-nums">-{fmt(t.amount)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-between text-xs text-slate-400">
          <span>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</span>
          <span>Total: <span className="text-white font-semibold">{fmt(filtered.reduce((s,t)=>s+t.amount,0))}</span></span>
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────
   SECTION 9 — INVESTMENTS TAB
   ────────────────────────────────────────────── */

function InvestmentsTab() {
  const { state, dispatch } = useContext(AppContext);
  const { selectedFunds, portfolioAlloc } = state;

  const [search, setSearch] = useState("");
  const [calcFund, setCalcFund] = useState(FUNDS[0].id);
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcYears, setCalcYears] = useState(5);
  const [activeSection, setActiveSection] = useState("funds"); // funds | compare | calculator | portfolio

  const FUND_COLORS = ["#10b981","#6366f1","#f59e0b","#ec4899","#3b82f6","#f97316"];
  const RISK_COLORS = { Low: "text-emerald-400 bg-emerald-400/10", Medium: "text-amber-400 bg-amber-400/10", High: "text-red-400 bg-red-400/10" };

  const filteredFunds = useMemo(() => {
    if (!search) return FUNDS;
    const q = search.toLowerCase();
    return FUNDS.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.risk.toLowerCase().includes(q));
  }, [search]);

  // Fund comparison chart data (12-month performance)
  const comparisonData = useMemo(() => {
    if (selectedFunds.length === 0) return [];
    return Array.from({length:12}, (_,i) => {
      const point = { month: SHORT_MONTHS[i] };
      selectedFunds.forEach(fid => {
        const fund = FUNDS.find(f=>f.id===fid);
        const cumReturn = fund.monthlyReturns.slice(0, i+1).reduce((acc,r) => acc*(1+r/100), 1);
        point[fund.name] = +((cumReturn - 1)*100).toFixed(2);
      });
      return point;
    });
  }, [selectedFunds]);

  // Hypothetical growth calculator
  const projectionData = useMemo(() => {
    const fund = FUNDS.find(f=>f.id===calcFund);
    const avgMonthly = fund.monthlyReturns.reduce((s,r)=>s+r,0) / 12 / 100;
    const points = [];
    for (let y = 0; y <= calcYears; y++) {
      const months = y * 12;
      const value = calcAmount * Math.pow(1 + avgMonthly, months);
      points.push({ year: `Yr ${y}`, value: +value.toFixed(2) });
    }
    return points;
  }, [calcFund, calcAmount, calcYears]);

  // Portfolio builder
  const [tempAlloc, setTempAlloc] = useState(() => {
    const init = {};
    FUNDS.forEach(f => init[f.id] = portfolioAlloc[f.id] || 0);
    return init;
  });

  const allocTotal = Object.values(tempAlloc).reduce((s,v)=>s+v, 0);

  const portfolioPieData = FUNDS.filter(f => tempAlloc[f.id] > 0).map((f,i) => ({
    name: f.name, value: tempAlloc[f.id], color: FUND_COLORS[i]
  }));

  const blendedReturn = useMemo(() => {
    let total = 0;
    FUNDS.forEach(f => {
      if (tempAlloc[f.id] > 0) {
        const annualReturn = f.monthlyReturns.reduce((acc,r)=>acc*(1+r/100),1) - 1;
        total += annualReturn * (tempAlloc[f.id] / 100);
      }
    });
    return total * 100;
  }, [tempAlloc]);

  const subTabs = [
    { id:"funds", label:"Fund Cards" },
    { id:"compare", label:"Compare" },
    { id:"calculator", label:"Calculator" },
    { id:"portfolio", label:"Portfolio Builder" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white" style={{fontFamily:"'Outfit', sans-serif"}}>Investments</h2>
        <div className="max-w-xs w-full sm:w-auto">
          <SearchInput value={search} onChange={setSearch} placeholder="Search funds…" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06] overflow-x-auto">
        {subTabs.map(t => (
          <button key={t.id} onClick={()=>setActiveSection(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeSection===t.id ? "bg-emerald-500/15 text-emerald-400" : "text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FUND CARDS */}
      {activeSection === "funds" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFunds.map((fund, idx) => {
            const r1 = getFundReturn(fund, 1)*100;
            const r3 = getFundReturn(fund, 3)*100;
            const r12 = getFundReturn(fund, 12)*100;
            const isSelected = selectedFunds.includes(fund.id);
            return (
              <Card key={fund.id} className={`cursor-pointer hover:border-white/10 transition-all ${isSelected ? "!border-emerald-500/30 ring-1 ring-emerald-500/20" : ""}`}
                onClick={() => dispatch({type:"TOGGLE_FUND", payload:fund.id})}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{fund.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{fund.type}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${RISK_COLORS[fund.risk]}`}>{fund.risk}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[["1M",r1],["3M",r3],["12M",r12]].map(([label,ret]) => (
                    <div key={label} className="text-center p-2 rounded-lg bg-white/[0.03]">
                      <p className="text-[10px] text-slate-500">{label}</p>
                      <p className={`text-sm font-bold ${ret >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(ret)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Expense Ratio: {fund.expenseRatio}%</span>
                  {isSelected && <span className="text-emerald-400 font-medium">✓ Selected</span>}
                </div>
                {/* Mini sparkline */}
                <div className="mt-3 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fund.monthlyReturns.map((r,i)=>({m:i,v:fund.monthlyReturns.slice(0,i+1).reduce((a,x)=>a*(1+x/100),1)}))}>
                      <defs>
                        <linearGradient id={`spark-${fund.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={FUND_COLORS[idx]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={FUND_COLORS[idx]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={FUND_COLORS[idx]} strokeWidth={1.5} fill={`url(#spark-${fund.id})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* COMPARISON */}
      {activeSection === "compare" && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Fund Comparison (12-Month Performance)</h3>
          <p className="text-xs text-slate-500 mb-4">Select up to 3 funds from Fund Cards to compare</p>
          {selectedFunds.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">Select funds from the Fund Cards tab to compare</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v=>`${v.toFixed(2)}%`} />} />
                <Legend wrapperStyle={{fontSize:11, color:"#94a3b8"}} />
                {selectedFunds.map((fid,i) => {
                  const fund = FUNDS.find(f=>f.id===fid);
                  return <Line key={fid} type="monotone" dataKey={fund.name} stroke={FUND_COLORS[i]} strokeWidth={2} dot={false} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* HYPOTHETICAL CALCULATOR */}
      {activeSection === "calculator" && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Hypothetical Growth Calculator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 block">Fund</label>
              <select value={calcFund} onChange={e=>setCalcFund(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50">
                {FUNDS.map(f => <option key={f.id} value={f.id} className="bg-slate-800">{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 block">Investment ($)</label>
              <input type="number" value={calcAmount} onChange={e=>setCalcAmount(+e.target.value)} min="100"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 block">Time Horizon (years)</label>
              <input type="range" min="1" max="10" value={calcYears} onChange={e=>setCalcYears(+e.target.value)}
                className="w-full accent-emerald-500 mt-2" />
              <p className="text-xs text-slate-400 text-center mt-1">{calcYears} year{calcYears>1?"s":""}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#projGrad)" name="Projected Value" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <p className="text-[10px] text-amber-400/80">⚠️ This projection uses historical average monthly returns with compound growth. Past performance does not guarantee future results. This is not financial advice.</p>
          </div>
        </Card>
      )}

      {/* PORTFOLIO BUILDER */}
      {activeSection === "portfolio" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Allocate Funds</h3>
            <div className="space-y-3">
              {FUNDS.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 w-36 truncate">{f.name}</span>
                  <input type="range" min="0" max="100" step="5" value={tempAlloc[f.id]||0}
                    onChange={e=>setTempAlloc(prev=>({...prev,[f.id]:+e.target.value}))}
                    className="flex-1 accent-emerald-500" />
                  <span className="text-xs text-white w-10 text-right tabular-nums">{tempAlloc[f.id]||0}%</span>
                </div>
              ))}
            </div>
            <div className={`mt-4 text-sm font-semibold ${allocTotal === 100 ? "text-emerald-400" : "text-red-400"}`}>
              Total: {allocTotal}% {allocTotal !== 100 && "(must be 100%)"}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span>Blended Annual Return:</span>
              <span className={`font-bold ${blendedReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(blendedReturn)}</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Portfolio Allocation</h3>
            {portfolioPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={portfolioPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {portfolioPieData.map((d,i)=> <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={v=>`${v}%`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {portfolioPieData.map(d => (
                    <span key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{background:d.color}} />{d.name}: {d.value}%
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">Allocate percentages to see chart</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   SECTION 10 — BUDGETS TAB
   ────────────────────────────────────────────── */

function BudgetsTab() {
  const { state, dispatch } = useContext(AppContext);
  const { transactions, budgets, selectedMonth } = state;
  const [search, setSearch] = useState("");

  const monthTxns = useMemo(() => getMonthTransactions(transactions, selectedMonth), [transactions, selectedMonth]);

  const budgetData = CATEGORIES.map(cat => {
    const spent = getCategoryTotal(monthTxns, cat);
    const budget = budgets[cat] || 0;
    const pct = budget ? (spent/budget*100) : 0;
    const remaining = budget - spent;
    return { cat, spent, budget, pct, remaining };
  }).filter(b => !search || b.cat.toLowerCase().includes(search.toLowerCase()));

  const totalBudget = Object.values(budgets).reduce((s,v)=>s+v, 0);
  const totalSpent = monthTxns.reduce((s,t)=>s+t.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white" style={{fontFamily:"'Outfit', sans-serif"}}>Budgets</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />
          <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            {[0,1,2].map(m => <MonthButton key={m} m={m} />)}
          </div>
        </div>
      </div>

      {/* Overview card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Budget" value={fmt(totalBudget)} icon="🎯" />
        <StatCard label="Total Spent" value={fmt(totalSpent)} positive={totalSpent <= totalBudget} icon="💳" />
        <StatCard label="Remaining" value={fmt(totalBudget - totalSpent)} positive={totalBudget - totalSpent > 0} icon="💰" />
      </div>

      {/* Budget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {budgetData.map(b => (
          <Card key={b.cat}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CAT_ICONS[b.cat]}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{b.cat}</p>
                  <p className="text-[10px] text-slate-500">{fmt(b.spent)} of {fmt(b.budget)}</p>
                </div>
              </div>
              <span className={`text-lg font-bold tabular-nums ${b.pct > 100 ? "text-red-400" : b.pct > 90 ? "text-amber-400" : "text-emerald-400"}`}>
                {b.pct.toFixed(0)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all duration-500 ${
                b.pct > 100 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" :
                b.pct > 90 ? "bg-gradient-to-r from-amber-500 to-red-500" :
                b.pct > 70 ? "bg-amber-500" : "bg-emerald-500"
              }`} style={{width:`${Math.min(b.pct,100)}%`}} />
            </div>
            {/* Edit budget */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500">Budget:</label>
              <input type="number" value={b.budget} min="0" step="50"
                onChange={e => dispatch({type:"SET_BUDGET", payload:{category:b.cat, amount:+e.target.value}})}
                className="w-24 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-emerald-500/50" />
              <span className={`text-xs ml-auto ${b.remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {b.remaining >= 0 ? `${fmt(b.remaining)} left` : `${fmt(Math.abs(b.remaining))} over`}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   SECTION 11 — SETTINGS TAB
   ────────────────────────────────────────────── */

function SettingsTab() {
  const { state, dispatch } = useContext(AppContext);
  const { user } = state;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currency, setCurrency] = useState(user.currency);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    dispatch({type:"UPDATE_PROFILE", payload:{name, email, currency}});
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-2xl font-bold text-white" style={{fontFamily:"'Outfit', sans-serif"}}>Settings</h2>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-5">Profile Information</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
            {name.split(" ").map(w=>w[0]).join("").slice(0,2)}
          </div>
          <div>
            <p className="text-white font-semibold">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1.5 block">Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1.5 block">Currency</label>
            <select value={currency} onChange={e=>setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50">
              <option value="USD" className="bg-slate-800">USD — US Dollar</option>
              <option value="EUR" className="bg-slate-800">EUR — Euro</option>
              <option value="GBP" className="bg-slate-800">GBP — British Pound</option>
            </select>
          </div>
          <button onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Preferences</h3>
        <div className="space-y-3">
          {[["Dark Mode","Always enabled for this fintech theme",true],["Email Notifications","Receive budget alert emails",false],["Monthly Reports","Auto-generate monthly spending reports",true]].map(([label,desc,defaultOn]) => (
            <label key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition cursor-pointer">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
              <ToggleSwitch defaultOn={defaultOn} />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ToggleSwitch({ defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={()=>setOn(!on)}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-emerald-500" : "bg-slate-700"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/* ──────────────────────────────────────────────
   SECTION 12 — MAIN APP COMPONENT
   ────────────────────────────────────────────── */

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!state.isAuthenticated) {
    return <LoginScreen onLogin={() => dispatch({type:"LOGIN"})} />;
  }

  const setTab = (tab) => dispatch({type:"SET_TAB", payload:tab});

  const renderTab = () => {
    switch(state.activeTab) {
      case "dashboard": return <DashboardTab />;
      case "expenses": return <ExpensesTab />;
      case "investments": return <InvestmentsTab />;
      case "budgets": return <BudgetsTab />;
      case "settings": return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        {/* Background ambient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[150px]" />
        </div>

        <Sidebar activeTab={state.activeTab} setTab={setTab} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={state.user} onLogout={() => dispatch({type:"LOGOUT"})} />

        {/* Main content area */}
        <main className={`relative z-10 transition-all duration-300 ${sidebarCollapsed ? "ml-[68px]" : "ml-60"} min-h-screen`}>
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white capitalize" style={{fontFamily:"'Outfit', sans-serif"}}>{state.activeTab}</h1>
              <p className="text-[10px] text-slate-500">{MONTH_NAMES[state.selectedMonth]} 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setTab("settings")} className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition">
                {state.user.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </button>
            </div>
          </header>

          {/* Page content */}
          <div className="p-6">
            {renderTab()}
          </div>

          {/* Disclaimer footer */}
          <footer className="border-t border-white/[0.06] px-6 py-4 text-center">
            <p className="text-[10px] text-slate-600">This is a demo application. Not real financial advice. All data is fictional and resets on refresh.</p>
          </footer>
        </main>
      </div>
    </AppContext.Provider>
  );
}
