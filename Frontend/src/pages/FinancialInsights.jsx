import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BellRing, CalendarClock,
  CheckCircle2, CircleDollarSign, Clock3, Lightbulb, RefreshCw, ShieldAlert, TrendingUp, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const cardClass = "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#081321]";
const shortDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

const severityStyle = {
  high: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
  medium: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  low: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
};
const typeIcon = (type) => type === "bill" ? CalendarClock : type === "goal" ? CircleDollarSign : type === "anomaly" ? ShieldAlert : AlertTriangle;

export default function FinancialInsights() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/insights?month=${encodeURIComponent(month)}`);
      if (!response) return;
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Could not load insights");
      setData(payload);
    } catch (error) {
      console.error("Financial insights load error:", error);
      toast.error(error.message || "Failed to load financial insights");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary || {};
  const cards = [
    { label: "Income", value: money(summary.totalIncome), note: "Recorded income", icon: ArrowUpRight, tone: "text-emerald-600" },
    { label: "Expenses", value: money(summary.totalExpenses), note: `${summary.transactionCount || 0} total transactions`, icon: ArrowDownRight, tone: "text-rose-600" },
    { label: "Net cash flow", value: money(summary.netCashFlow), note: "Income minus expenses", icon: Wallet, tone: Number(summary.netCashFlow || 0) >= 0 ? "text-emerald-600" : "text-rose-600" },
    { label: "Savings rate", value: summary.savingsRate == null ? "—" : `${summary.savingsRate}%`, note: "Based on recorded income", icon: TrendingUp, tone: "text-indigo-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Activity size={14} /> FinSight intelligence</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Financial Insights</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monthly cash flow, spending patterns, and action-ready alerts.</p>
        </div>
        <div className="flex gap-2">
          <input aria-label="Insights month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          <button onClick={load} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>

      {loading && !data ? <div className={`${cardClass} py-16 text-center text-sm text-slate-500`}>Generating your insights…</div> : null}
      {!loading && !data ? <div className={`${cardClass} py-12 text-center`}><p className="font-semibold text-slate-900 dark:text-white">Insights are unavailable</p><p className="mt-1 text-sm text-slate-500">Try refreshing the page.</p></div> : null}
      {data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return <div key={card.label} className={cardClass}>
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</span><Icon size={19} className={card.tone} /></div>
              <p className={`mt-3 text-2xl font-bold tracking-tight ${card.tone}`}>{card.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.note}</p>
            </div>;
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Spending breakdown</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Top categories for {month}</p></div><TrendingUp className="text-indigo-600" size={20} /></div>
            {data.topCategories?.length ? <div className="mt-5 space-y-5">
              {data.topCategories.map((item) => <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-800 dark:text-slate-200">{item.category}</span><span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(item.amount)} <span className="font-normal text-slate-400">({item.share}%)</span></span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, item.share)}%` }} /></div>
                <p className="mt-1 text-xs text-slate-400">{item.count} transaction(s)</p>
              </div>)}
            </div> : <div className="mt-8 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700"><Lightbulb className="mx-auto text-slate-400" size={24} /><p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No expenses found for this month</p><p className="mt-1 text-xs text-slate-500">Add transactions or choose another month to see spending patterns.</p></div>}
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly signals</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A quick read of your money</p></div><Lightbulb className="text-amber-500" size={20} /></div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Average daily spend</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{money(summary.averageDailySpend)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Previous month expenses</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{money(summary.previousTotalExpenses)}</p>{summary.expenseChange == null ? <p className="mt-1 text-xs text-slate-500">Not enough previous-month data to compare.</p> : <p className={`mt-1 text-xs ${summary.expenseChange > 0 ? "text-rose-600" : summary.expenseChange < 0 ? "text-emerald-600" : "text-slate-500"}`}>{summary.expenseChange > 0 ? "Up" : summary.expenseChange < 0 ? "Down" : "Unchanged"} {Math.abs(summary.expenseChange)}% vs previous month</p>}</div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recurring commitments</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{money(summary.monthlyRecurringBills)}<span className="ml-1 text-xs font-normal text-slate-500">/ month est.</span></p></div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget position</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{money(summary.budgetSpent)} <span className="text-sm font-normal text-slate-500">of {money(summary.totalBudgeted)}</span></p><p className="mt-1 text-xs text-slate-500">{money(summary.budgetRemaining)} remaining across created budgets</p></div>
            </div>
          </section>
        </div>

        <section className={cardClass}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><BellRing size={19} className="text-amber-500" /> Alerts & reminders</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generated from your budgets, bills, goals, and flagged transactions.</p></div><span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{data.alerts?.length || 0} active</span></div>
          {data.alerts?.length ? <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {data.alerts.map((alert) => {
              const Icon = typeIcon(alert.type);
              return <div key={alert.id} className={`flex gap-3 rounded-xl border p-4 ${severityStyle[alert.severity] || severityStyle.low}`}>
                <div className="mt-0.5 shrink-0"><Icon size={19} /></div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{alert.title}</p><span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-black/20">{alert.severity}</span></div><p className="mt-1 text-sm opacity-90">{alert.message}</p>{alert.amount != null && <p className="mt-2 text-sm font-bold">{money(alert.amount)}{alert.relatedAmount != null ? ` / ${money(alert.relatedAmount)}` : ""}</p>}{alert.dueDate && <p className="mt-1 flex items-center gap-1 text-xs opacity-80"><Clock3 size={12} /> Due {shortDate(alert.dueDate)}</p>}</div>
              </div>;
            })}
          </div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700"><CheckCircle2 className="mx-auto text-emerald-500" size={26} /><p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">You're all caught up</p><p className="mt-1 text-sm text-slate-500">No budget, bill, or goal alerts need attention right now.</p></div>}
          <p className="mt-4 text-xs text-slate-400">These are in-app alerts generated when this page loads. They do not send push notifications, SMS, or email.</p>
        </section>
        <p className="text-right text-xs text-slate-400">Updated {new Date(data.generatedAt).toLocaleString("en-IN")}</p>
      </>}
    </div>
  );
}
