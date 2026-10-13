import Budget from "../models/Budget.js";
import SavingsGoal from "../models/SavingsGoal.js";
import RecurringBill from "../models/RecurringBill.js";
import Transaction from "../models/Transaction.js";

const isValidMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ""));
const money = (value) => Number(Number(value || 0).toFixed(2));
const keyOf = (value) => String(value || "Other").trim().toLocaleLowerCase("en-US");
const monthBounds = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
};
const shiftMonth = (month, offset) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};
const dayDiff = (dateA, dateB) => Math.ceil((dateA.getTime() - dateB.getTime()) / 86400000);

export const getFinancialInsights = async (req, res) => {
  try {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = String(req.query.month || defaultMonth);
    if (!isValidMonth(month)) {
      return res.status(400).json({ success: false, message: "Month must use YYYY-MM format" });
    }

    const { start, end } = monthBounds(month);
    const previousMonth = shiftMonth(month, -1);
    const previousBounds = monthBounds(previousMonth);
    const [transactions, previousTransactions, budgets, bills, goals] = await Promise.all([
      Transaction.find({ user: req.user._id, date: { $gte: start, $lt: end } })
        .select("date type amount category description isAnomaly anomalyScore")
        .lean(),
      Transaction.find({ user: req.user._id, date: { $gte: previousBounds.start, $lt: previousBounds.end } })
        .select("type amount category")
        .lean(),
      Budget.find({ user: req.user._id, month }).lean(),
      RecurringBill.find({ user: req.user._id, status: "active" }).select("name amount category nextDueDate frequency").lean(),
      SavingsGoal.find({ user: req.user._id, status: "active" }).select("name targetAmount currentAmount targetDate").lean(),
    ]);

    const normalizedType = (t) => String(t || "").trim().toLowerCase();
    const isExpense = (t) => normalizedType(t) === "expense";
    const isIncome = (t) => normalizedType(t) === "income";
    const expenses = transactions.filter((t) => isExpense(t.type));
    const incomes = transactions.filter((t) => isIncome(t.type));
    const previousExpenses = previousTransactions.filter((t) => isExpense(t.type));
    const totalExpenses = money(expenses.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0));
    const totalIncome = money(incomes.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0));
    const previousTotalExpenses = money(previousExpenses.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0));
    const netCashFlow = money(totalIncome - totalExpenses);
    const savingsRate = totalIncome > 0 ? money((netCashFlow / totalIncome) * 100) : null;
    const expenseChange = previousTotalExpenses > 0
      ? money(((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100)
      : null;

    const categoryTotals = new Map();
    for (const transaction of expenses) {
      const category = String(transaction.category || "Other").trim() || "Other";
      const key = keyOf(category);
      const existing = categoryTotals.get(key) || { category, amount: 0, count: 0 };
      existing.amount += Math.abs(Number(transaction.amount || 0));
      existing.count += 1;
      categoryTotals.set(key, existing);
    }
    const topCategories = [...categoryTotals.values()]
      .map((item) => ({ ...item, amount: money(item.amount), share: totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const spendByCategory = new Map();
    for (const item of categoryTotals.values()) spendByCategory.set(keyOf(item.category), item.amount);
    const alerts = [];
    for (const budget of budgets) {
      const spent = money(spendByCategory.get(budget.categoryKey || keyOf(budget.category)) || 0);
      const limit = Number(budget.monthlyLimit || 0);
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      if (percentage >= 100) {
        alerts.push({ id: `budget-over-${budget._id}`, type: "budget", severity: "high", title: `${budget.category} budget exceeded`, message: `${budget.category} spending is ${percentage}% of its monthly limit.`, amount: spent, relatedAmount: limit, action: "Review spending" });
      } else if (percentage >= 80) {
        alerts.push({ id: `budget-near-${budget._id}`, type: "budget", severity: "medium", title: `${budget.category} budget nearly used`, message: `${budget.category} spending has reached ${percentage}% of its monthly limit.`, amount: spent, relatedAmount: limit, action: "Check budget" });
      }
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const bill of bills) {
      const dueDate = new Date(bill.nextDueDate);
      const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const daysUntilDue = dayDiff(dueDay, today);
      if (daysUntilDue < 0) {
        alerts.push({ id: `bill-overdue-${bill._id}`, type: "bill", severity: "high", title: `${bill.name} is overdue`, message: `This bill was due ${Math.abs(daysUntilDue)} day(s) ago.`, amount: money(bill.amount), dueDate: bill.nextDueDate, action: "Mark paid or update due date" });
      } else if (daysUntilDue <= 3) {
        alerts.push({ id: `bill-due-${bill._id}`, type: "bill", severity: daysUntilDue === 0 ? "high" : "medium", title: daysUntilDue === 0 ? `${bill.name} is due today` : `${bill.name} is due soon`, message: daysUntilDue === 0 ? "Your recurring bill is due today." : `Your recurring bill is due in ${daysUntilDue} day(s).`, amount: money(bill.amount), dueDate: bill.nextDueDate, action: "Review recurring bill" });
      }
    }

    for (const goal of goals) {
      if (!goal.targetDate || Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0)) continue;
      const target = new Date(goal.targetDate);
      const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const daysLeft = dayDiff(targetDay, today);
      if (daysLeft < 0) {
        alerts.push({ id: `goal-overdue-${goal._id}`, type: "goal", severity: "medium", title: `${goal.name} target date passed`, message: `The goal is ${Math.abs(daysLeft)} day(s) past its target date.`, amount: money(goal.targetAmount - goal.currentAmount), action: "Review savings goal" });
      } else if (daysLeft <= 7) {
        alerts.push({ id: `goal-due-${goal._id}`, type: "goal", severity: "low", title: `${goal.name} target is approaching`, message: `${daysLeft === 0 ? "The target date is today." : `${daysLeft} day(s) remain until the target date.`} Keep your savings plan on track.`, amount: money(goal.targetAmount - goal.currentAmount), action: "Review savings goal" });
      }
    }

    const anomalyCount = transactions.filter((t) => t.isAnomaly === true).length;
    if (anomalyCount > 0) {
      alerts.push({ id: "anomaly-month", type: "anomaly", severity: "medium", title: `${anomalyCount} flagged transaction(s)`, message: "Review transactions flagged by FinSight's anomaly detector.", action: "Review transactions" });
    }
    const severityRank = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    const activeDays = month === defaultMonth ? Math.max(1, now.getDate()) : Math.max(1, Math.round((end - start) / 86400000));
    const totalBudgeted = money(budgets.reduce((sum, b) => sum + Number(b.monthlyLimit || 0), 0));
    const budgetSpent = money(budgets.reduce((sum, b) => sum + (spendByCategory.get(b.categoryKey || keyOf(b.category)) || 0), 0));
    const monthlyBills = bills.reduce((sum, bill) => {
      const amount = Number(bill.amount || 0);
      if (bill.frequency === "weekly") return sum + amount * 52 / 12;
      if (bill.frequency === "yearly") return sum + amount / 12;
      return sum + amount;
    }, 0);

    return res.json({
      success: true,
      month,
      previousMonth,
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow,
        savingsRate,
        previousTotalExpenses,
        expenseChange,
        totalBudgeted,
        budgetSpent,
        budgetRemaining: money(totalBudgeted - budgetSpent),
        monthlyRecurringBills: money(monthlyBills),
        flaggedTransactions: anomalyCount,
        transactionCount: transactions.length,
        averageDailySpend: money(totalExpenses / activeDays),
      },
      topCategories,
      alerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Financial insights error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to generate financial insights" });
  }
};
