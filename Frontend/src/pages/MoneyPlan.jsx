import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  ReceiptText,
  CalendarClock,
  Pause,
  Play,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";

const localDateInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#405be8] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

const MoneyPlan = () => {
  const [activeTab, setActiveTab] = useState("budgets");
  const [month, setMonth] = useState(currentMonth);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [billSummary, setBillSummary] = useState({ activeCount: 0, monthlyEquivalent: 0, overdueCount: 0 });
  const [budgetSummary, setBudgetSummary] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    totalExpenses: 0,
    categoriesOverBudget: 0,
    categoriesNearLimit: 0,
  });
  const [goalSummary, setGoalSummary] = useState({
    targetTotal: 0,
    savedTotal: 0,
    activeGoals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category: "", monthlyLimit: "" });
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", targetDate: "" });
  const [billForm, setBillForm] = useState({ name: "", amount: "", category: "Bills & Utilities", frequency: "monthly", nextDueDate: localDateInput(), notes: "" });
  const [billAccountChoices, setBillAccountChoices] = useState({});
  const [contributions, setContributions] = useState({});

  const fetchMoneyPlan = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetResponse, goalResponse, billResponse, accountResponse] = await Promise.all([
        authFetch(`${API_URL}/api/money-plan/budgets?month=${encodeURIComponent(month)}`),
        authFetch(`${API_URL}/api/money-plan/goals`),
        authFetch(`${API_URL}/api/money-plan/bills`),
        authFetch(`${API_URL}/api/accounts`),
      ]);
      if (!budgetResponse || !goalResponse || !billResponse || !accountResponse) return;

      const [budgetData, goalData, billData, accountData] = await Promise.all([
        budgetResponse.json(),
        goalResponse.json(),
        billResponse.json(),
        accountResponse.json(),
      ]);
      if (!budgetResponse.ok) throw new Error(budgetData.message || "Could not load budgets");
      if (!goalResponse.ok) throw new Error(goalData.message || "Could not load savings goals");
      if (!billResponse.ok) throw new Error(billData.message || "Could not load recurring bills");
      if (!accountResponse.ok) throw new Error(accountData.message || "Could not load accounts");

      setBudgets(budgetData.budgets || []);
      setBudgetSummary(budgetData.summary || {});
      setGoals(goalData.goals || []);
      setGoalSummary(goalData.summary || {});
      setBills(billData.bills || []);
      setBillSummary(billData.summary || {});
      setAccounts((accountData.accounts || []).filter((account) => account.isActive !== false));
    } catch (error) {
      console.error("Money Plan load error:", error);
      toast.error(error.message || "Failed to load Money Plan");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchMoneyPlan();
  }, [fetchMoneyPlan]);

  const budgetRemaining = useMemo(
    () => Number(budgetSummary.totalBudgeted || 0) - Number(budgetSummary.totalSpent || 0),
    [budgetSummary]
  );

  const resetBudgetForm = () => {
    setBudgetForm({ category: "", monthlyLimit: "" });
    setEditingBudgetId(null);
  };

  const submitBudget = async (event) => {
    event.preventDefault();
    const category = budgetForm.category.trim();
    const monthlyLimit = Number(budgetForm.monthlyLimit);
    if (!category || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      toast.error("Enter a category and a monthly limit greater than zero");
      return;
    }

    setSaving(true);
    try {
      const isEditing = Boolean(editingBudgetId);
      const response = await authFetch(
        isEditing
          ? `${API_URL}/api/money-plan/budgets/${editingBudgetId}`
          : `${API_URL}/api/money-plan/budgets`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEditing ? { monthlyLimit } : { category, monthlyLimit, month }
          ),
        }
      );
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save budget");
      toast.success(isEditing ? "Budget updated" : "Budget created");
      resetBudgetForm();
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const editBudget = (budget) => {
    setEditingBudgetId(budget._id);
    setBudgetForm({ category: budget.category, monthlyLimit: String(budget.monthlyLimit) });
    setActiveTab("budgets");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBudget = async (id) => {
    if (!window.confirm("Delete this monthly budget? Existing transactions will not be changed.")) return;
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/budgets/${id}`, { method: "DELETE" });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete budget");
      toast.success("Budget deleted");
      if (editingBudgetId === id) resetBudgetForm();
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to delete budget");
    }
  };

  const submitGoal = async (event) => {
    event.preventDefault();
    const name = goalForm.name.trim();
    const targetAmount = Number(goalForm.targetAmount);
    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      toast.error("Enter a goal name and target amount greater than zero");
      return;
    }
    setSaving(true);
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetAmount,
          targetDate: goalForm.targetDate || null,
        }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create savings goal");
      toast.success("Savings goal created");
      setGoalForm({ name: "", targetAmount: "", targetDate: "" });
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to create savings goal");
    } finally {
      setSaving(false);
    }
  };

  const addContribution = async (goal) => {
    const form = contributions[goal._id] || {};
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a contribution greater than zero");
      return;
    }
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/goals/${goal._id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: form.note || "" }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add contribution");
      toast.success(data.goal?.status === "completed" ? "Goal reached! Congratulations 🎉" : "Contribution added");
      setContributions((current) => ({ ...current, [goal._id]: { amount: "", note: "" } }));
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to add contribution");
    }
  };

  const deleteGoal = async (goal) => {
    if (!window.confirm(`Delete “${goal.name}” and its contribution history?`)) return;
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/goals/${goal._id}`, { method: "DELETE" });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete savings goal");
      toast.success("Savings goal deleted");
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to delete savings goal");
    }
  };

  const submitBill = async (event) => {
    event.preventDefault();
    const name = billForm.name.trim();
    const amount = Number(billForm.amount);
    if (!name || !Number.isFinite(amount) || amount <= 0 || !billForm.nextDueDate) {
      toast.error("Enter a bill name, valid amount and next due date");
      return;
    }
    setSaving(true);
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...billForm, name, amount }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create recurring bill");
      toast.success("Recurring bill added");
      setBillForm({ name: "", amount: "", category: "Bills & Utilities", frequency: "monthly", nextDueDate: localDateInput(), notes: "" });
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to add recurring bill");
    } finally {
      setSaving(false);
    }
  };

  const markBillPaid = async (bill) => {
    const accountId = billAccountChoices[bill._id] || "";
    const message = accountId
      ? `Mark ${bill.name} paid and record ${money(bill.amount)} as an expense in the selected account?`
      : `Mark ${bill.name} paid without creating a transaction? Choose an account to also record the expense and update its balance.`;
    if (!window.confirm(message)) return;
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/bills/${bill._id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: new Date(bill.nextDueDate).toISOString(), ...(accountId ? { accountId } : {}) }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not mark bill paid");
      toast.success(data.message || "Bill marked paid");
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to mark bill paid");
    }
  };

  const toggleBillStatus = async (bill) => {
    const status = bill.status === "paused" ? "active" : "paused";
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/bills/${bill._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update bill");
      toast.success(data.message || "Bill updated");
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to update bill");
    }
  };

  const deleteBill = async (bill) => {
    if (!window.confirm(`Delete recurring bill “${bill.name}”? Its recorded transaction history will remain.`)) return;
    try {
      const response = await authFetch(`${API_URL}/api/money-plan/bills/${bill._id}`, { method: "DELETE" });
      if (!response) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete bill");
      toast.success("Recurring bill deleted");
      await fetchMoneyPlan();
    } catch (error) {
      toast.error(error.message || "Failed to delete recurring bill");
    }
  };

  const monthLabel = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-xs font-semibold text-[#4F6BFF]">
            <Wallet size={14} /> Plan with purpose
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#07111F] dark:text-white">Money Plan</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Give your money a plan with category budgets and savings goals that update as you use FinSight.
          </p>
        </div>
        {activeTab === "budgets" && (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <CalendarDays size={17} className="text-[#4F6BFF]" />
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value || currentMonth())}
              className={`${inputClass} w-auto min-w-[170px]`}
              aria-label="Budget month"
            />
          </label>
        )}
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#081321]">
        <button
          type="button"
          onClick={() => setActiveTab("budgets")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === "budgets" ? "bg-[#4F6BFF] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        >
          <CircleDollarSign size={17} /> Budgets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bills")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === "bills" ? "bg-[#4F6BFF] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        >
          <ReceiptText size={17} /> Recurring bills
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("goals")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === "goals" ? "bg-[#4F6BFF] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        >
          <Target size={17} /> Savings goals
        </button>
      </div>

      {activeTab === "budgets" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={Wallet} label="Budgeted this month" value={money(budgetSummary.totalBudgeted)} detail={monthLabel} />
            <SummaryCard icon={CircleDollarSign} label="Total expenses this month" value={money(budgetSummary.totalExpenses)} detail="All recorded expenses in the selected month" />
            <SummaryCard icon={TrendingIcon} label="Budget remaining" value={money(budgetRemaining)} detail={budgetRemaining < 0 ? "You've exceeded your combined limits" : "Across your planned categories"} danger={budgetRemaining < 0} />
            <SummaryCard icon={AlertTriangle} label="Needs attention" value={Number(budgetSummary.categoriesOverBudget || 0) + Number(budgetSummary.categoriesNearLimit || 0)} detail={`${budgetSummary.categoriesOverBudget || 0} over · ${budgetSummary.categoriesNearLimit || 0} near limit`} danger={Number(budgetSummary.categoriesOverBudget || 0) > 0} />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#07111F] dark:text-white">Category budgets</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set category limits to compare your recorded expenses against your plan for {monthLabel}. Total expenses above include all expense transactions for the selected month.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{budgets.length} {budgets.length === 1 ? "category" : "categories"}</span>
              </div>

              {loading ? (
                <LoadingRows />
              ) : budgets.length === 0 ? (
                <EmptyState icon={CircleDollarSign} title="No budgets for this month yet" description="Your total expenses are shown above even without budgets. Create a category budget to track limits and get near-limit or over-budget alerts." />
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const percentage = Number(budget.percentage || 0);
                    const over = budget.status === "over";
                    const near = budget.status === "near";
                    const barColor = over ? "bg-rose-500" : near ? "bg-amber-500" : "bg-[#4F6BFF]";
                    return (
                      <div key={budget._id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-800 dark:text-slate-100">{budget.category}</h3>
                              {over ? <StatusPill tone="danger">Over budget</StatusPill> : near ? <StatusPill tone="warning">Near limit</StatusPill> : <StatusPill tone="success">On track</StatusPill>}
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{money(budget.spent)} spent of {money(budget.monthlyLimit)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button type="button" onClick={() => editBudget(budget)} className={secondaryButtonClass} aria-label={`Edit ${budget.category} budget`}><Pencil size={14} /> Edit</button>
                            <button type="button" onClick={() => deleteBudget(budget._id)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/30" aria-label={`Delete ${budget.category} budget`}><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, percentage)}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{percentage}% used</span>
                          <span className={over ? "font-semibold text-rose-600 dark:text-rose-400" : ""}>{over ? `${money(Math.abs(budget.remaining))} over` : `${money(budget.remaining)} left`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF]"><Plus size={19} /></div>
                <div>
                  <h2 className="font-bold text-[#07111F] dark:text-white">{editingBudgetId ? "Update budget" : "Create a budget"}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">For {monthLabel}</p>
                </div>
              </div>
              <form onSubmit={submitBudget} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Category</label>
                  <input className={inputClass} value={budgetForm.category} onChange={(event) => setBudgetForm((form) => ({ ...form, category: event.target.value }))} placeholder="e.g. Groceries, Transport" maxLength={50} required disabled={Boolean(editingBudgetId)} />
                  {editingBudgetId && <p className="mt-1 text-xs text-slate-500">Category is fixed when editing an existing budget.</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Monthly limit (₹)</label>
                  <input className={inputClass} type="number" min="1" step="0.01" value={budgetForm.monthlyLimit} onChange={(event) => setBudgetForm((form) => ({ ...form, monthlyLimit: event.target.value }))} placeholder="e.g. 8000" required />
                </div>
                <button className={`${primaryButtonClass} w-full`} type="submit" disabled={saving}>{saving ? "Saving…" : editingBudgetId ? "Save changes" : "Add budget"}</button>
                {editingBudgetId && <button type="button" className={`${secondaryButtonClass} w-full`} onClick={resetBudgetForm}>Cancel editing</button>}
              </form>
              <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-200">How this works</p>
                FinSight totals expense transactions assigned to the matching category and month. Transfers, income and refunds are not counted as spending here.
              </div>
            </section>
          </div>
        </>
      ) : activeTab === "goals" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard icon={Target} label="Total goal target" value={money(goalSummary.targetTotal)} detail="Across all savings goals" />
            <SummaryCard icon={PiggyBank} label="Saved toward goals" value={money(goalSummary.savedTotal)} detail="Contributions recorded in FinSight" />
            <SummaryCard icon={CheckCircle2} label="Active goals" value={Number(goalSummary.activeGoals || 0)} detail={`${goals.filter((goal) => goal.status === "completed").length} completed`} />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#07111F] dark:text-white">Your savings goals</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track progress and record contributions as you set money aside.</p>
              </div>
              {loading ? (
                <LoadingRows />
              ) : goals.length === 0 ? (
                <EmptyState icon={Target} title="Start with a goal" description="Create your first goal for an emergency fund, a trip, a new device or anything you're saving for." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {goals.map((goal) => {
                    const contribution = contributions[goal._id] || { amount: "", note: "" };
                    const complete = goal.status === "completed";
                    return (
                      <article key={goal._id} className="flex flex-col rounded-2xl border border-slate-100 p-4 dark:border-slate-800/80">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><PiggyBank size={21} /></div>
                            <div className="min-w-0">
                              <h3 className="break-words font-bold text-slate-800 dark:text-slate-100">{goal.name}</h3>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{goal.targetDate ? `Target ${new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "No target date"}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => deleteGoal(goal)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label={`Delete ${goal.name}`}><Trash2 size={16} /></button>
                        </div>
                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Saved so far</p>
                            <p className="mt-1 text-xl font-black tracking-tight text-[#07111F] dark:text-white">{money(goal.currentAmount)}</p>
                          </div>
                          <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400">of {money(goal.targetAmount)}</p>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all ${complete ? "bg-emerald-500" : "bg-[#4F6BFF]"}`} style={{ width: `${Math.min(100, Number(goal.progress || 0))}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className={complete ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}>{complete ? "Goal reached" : `${goal.progress || 0}% complete`}</span>
                          <span className="text-slate-500 dark:text-slate-400">{money(goal.remaining)} to go</span>
                        </div>
                        {!complete && (
                          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Add contribution</p>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <input className={inputClass} type="number" min="0.01" step="0.01" value={contribution.amount} onChange={(event) => setContributions((current) => ({ ...current, [goal._id]: { ...contribution, amount: event.target.value } }))} placeholder="Amount ₹" aria-label={`Contribution amount for ${goal.name}`} />
                              <button type="button" className={primaryButtonClass} onClick={() => addContribution(goal)}><Plus size={15} /> Add</button>
                            </div>
                            <input className={inputClass} value={contribution.note} onChange={(event) => setContributions((current) => ({ ...current, [goal._id]: { ...contribution, note: event.target.value } }))} placeholder="Optional note (e.g. monthly saving)" maxLength={160} aria-label={`Contribution note for ${goal.name}`} />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Target size={20} /></div>
                <div>
                  <h2 className="font-bold text-[#07111F] dark:text-white">Create a savings goal</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Make the next milestone tangible.</p>
                </div>
              </div>
              <form onSubmit={submitGoal} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Goal name</label>
                  <input className={inputClass} value={goalForm.name} onChange={(event) => setGoalForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Emergency fund" maxLength={80} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Target amount (₹)</label>
                  <input className={inputClass} type="number" min="1" step="0.01" value={goalForm.targetAmount} onChange={(event) => setGoalForm((form) => ({ ...form, targetAmount: event.target.value }))} placeholder="e.g. 100000" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Target date <span className="font-normal text-slate-400">(optional)</span></label>
                  <input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={goalForm.targetDate} onChange={(event) => setGoalForm((form) => ({ ...form, targetDate: event.target.value }))} />
                </div>
                <button className={`${primaryButtonClass} w-full`} type="submit" disabled={saving}>{saving ? "Creating…" : "Create goal"}</button>
              </form>
              <div className="mt-5 rounded-xl bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="font-semibold">Keep contributions realistic</p>
                Goal contributions are tracking entries only. They do not move money between bank accounts or create bank transactions.
              </div>
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard icon={ReceiptText} label="Active recurring bills" value={Number(billSummary.activeCount || 0)} detail="Bills you are currently tracking" />
            <SummaryCard icon={CalendarClock} label="Monthly equivalent" value={money(billSummary.monthlyEquivalent)} detail="Estimated recurring commitments" />
            <SummaryCard icon={AlertTriangle} label="Overdue bills" value={Number(billSummary.overdueCount || 0)} detail="Active bills past their due date" danger={Number(billSummary.overdueCount || 0) > 0} />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#07111F] dark:text-white">Recurring bills</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep track of subscriptions, rent, utilities and other recurring payments.</p>
              </div>
              {loading ? <LoadingRows /> : bills.length === 0 ? (
                <EmptyState icon={ReceiptText} title="No recurring bills tracked" description="Add your regular bills to see what is due next and estimate your recurring commitments." />
              ) : (
                <div className="space-y-4">
                  {bills.map((bill) => {
                    const overdue = bill.dueState === "overdue";
                    const dueSoon = bill.dueState === "due_soon";
                    const paused = bill.status === "paused";
                    const chosenAccount = billAccountChoices[bill._id] || "";
                    return (
                      <article key={bill._id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${overdue ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-[#4F6BFF]/10 text-[#4F6BFF]"}`}><ReceiptText size={20} /></div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">{bill.name}</h3>
                                {paused ? <StatusPill tone="warning">Paused</StatusPill> : overdue ? <StatusPill tone="danger">Overdue</StatusPill> : dueSoon ? <StatusPill tone="warning">Due soon</StatusPill> : <StatusPill tone="success">Upcoming</StatusPill>}
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{bill.category} · {bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1)}</p>
                              <p className={`mt-1 text-sm ${overdue ? "font-semibold text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {paused ? "Reminders paused" : overdue ? `${Math.abs(bill.daysUntilDue)} days overdue` : bill.daysUntilDue === 0 ? "Due today" : `Due in ${bill.daysUntilDue} day${bill.daysUntilDue === 1 ? "" : "s"}`}
                              </p>
                              {bill.notes && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{bill.notes}</p>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <p className="text-xl font-black text-[#07111F] dark:text-white">{money(bill.amount)}</p>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => toggleBillStatus(bill)} className={secondaryButtonClass} aria-label={paused ? `Resume ${bill.name}` : `Pause ${bill.name}`}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? "Resume" : "Pause"}</button>
                              <button type="button" onClick={() => deleteBill(bill)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/30" aria-label={`Delete ${bill.name}`}><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </div>
                        {!paused && (
                          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <select className={inputClass} value={chosenAccount} onChange={(event) => setBillAccountChoices((current) => ({ ...current, [bill._id]: event.target.value }))} aria-label={`Account to record ${bill.name} payment`}>
                              <option value="">Mark paid only (don't create transaction)</option>
                              {accounts.map((account) => <option key={account._id} value={account._id}>{account.name}{account.last4 ? ` •••• ${account.last4}` : ""}</option>)}
                            </select>
                            <button type="button" onClick={() => markBillPaid(bill)} className={primaryButtonClass}><CheckCircle size={16} /> Mark paid</button>
                          </div>
                        )}
                        {bill.lastPaidAt && <p className="mt-2 text-xs text-slate-400">Last marked paid {new Date(bill.lastPaidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF]"><Plus size={19} /></div>
                <div>
                  <h2 className="font-bold text-[#07111F] dark:text-white">Track a recurring bill</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add a payment you don't want to forget.</p>
                </div>
              </div>
              <form onSubmit={submitBill} className="space-y-4">
                <div><label className="mb-1.5 block text-sm font-semibold">Bill or subscription</label><input className={inputClass} value={billForm.name} onChange={(event) => setBillForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Internet, rent, streaming" maxLength={80} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold">Amount (₹)</label><input className={inputClass} type="number" min="0.01" step="0.01" value={billForm.amount} onChange={(event) => setBillForm((form) => ({ ...form, amount: event.target.value }))} placeholder="e.g. 999" required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold">Category</label><input className={inputClass} value={billForm.category} onChange={(event) => setBillForm((form) => ({ ...form, category: event.target.value }))} maxLength={50} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold">Frequency</label><select className={inputClass} value={billForm.frequency} onChange={(event) => setBillForm((form) => ({ ...form, frequency: event.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                <div><label className="mb-1.5 block text-sm font-semibold">Next due date</label><input className={inputClass} type="date" value={billForm.nextDueDate} onChange={(event) => setBillForm((form) => ({ ...form, nextDueDate: event.target.value }))} required /></div>
                <div><label className="mb-1.5 block text-sm font-semibold">Note <span className="font-normal text-slate-400">(optional)</span></label><input className={inputClass} value={billForm.notes} onChange={(event) => setBillForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Any useful details" maxLength={240} /></div>
                <button className={`${primaryButtonClass} w-full`} type="submit" disabled={saving}>{saving ? "Saving…" : "Add recurring bill"}</button>
              </form>
              <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">Choose an account before marking a bill paid if you want FinSight to create an expense transaction and update that account's balance. Otherwise, FinSight only advances the bill's due date.</div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, detail, danger = false }) => (
  <div className={`${cardClass} p-4 sm:p-5`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-2 break-words text-2xl font-black tracking-tight ${danger ? "text-rose-600 dark:text-rose-400" : "text-[#07111F] dark:text-white"}`}>{value}</p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-[#4F6BFF]/10 text-[#4F6BFF]"}`}><Icon size={19} /></div>
    </div>
    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
  </div>
);

const StatusPill = ({ tone, children }) => {
  const tones = {
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone] || tones.success}`}>{children}</span>;
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center px-4 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Icon size={22} /></div>
    <h3 className="mt-4 font-bold text-slate-800 dark:text-slate-100">{title}</h3>
    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

const LoadingRows = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"><div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" /><div className="mt-3 h-3 w-48 rounded bg-slate-100 dark:bg-slate-800" /><div className="mt-4 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" /></div>)}
  </div>
);

const TrendingIcon = CircleDollarSign;

export default MoneyPlan;
