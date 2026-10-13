import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";
import RecurringBill from "../models/RecurringBill.js";
import Account from "../models/Account.js";

const isValidMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ""));
const categoryKey = (category) => String(category || "").trim().toLocaleLowerCase("en-US");
const toMoney = (value) => Number(Number(value).toFixed(2));

const getMonthBounds = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
};

export const getBudgets = async (req, res) => {
  try {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = req.query.month || defaultMonth;

    if (!isValidMonth(month)) {
      return res.status(400).json({ success: false, message: "Month must use YYYY-MM format" });
    }

    const { start, end } = getMonthBounds(month);
    const [budgets, monthTransactions] = await Promise.all([
      Budget.find({ user: req.user._id, month }).sort({ category: 1 }).lean(),
      Transaction.find({
        user: req.user._id,
        date: { $gte: start, $lt: end },
      }).select("type category amount").lean(),
    ]);

    // Be tolerant of historical records saved as "Expense" as well as "expense".
    const expenses = monthTransactions.filter(
      (transaction) => String(transaction.type || "").trim().toLowerCase() === "expense"
    );
    const totalExpenses = toMoney(
      expenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    );

    const spentByCategory = new Map();
    for (const transaction of expenses) {
      const key = categoryKey(transaction.category || "Other");
      spentByCategory.set(key, (spentByCategory.get(key) || 0) + Number(transaction.amount || 0));
    }

    const items = budgets.map((budget) => {
      const spent = toMoney(spentByCategory.get(budget.categoryKey) || 0);
      const limit = Number(budget.monthlyLimit);
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        ...budget,
        spent,
        remaining: toMoney(limit - spent),
        percentage,
        status: percentage >= 100 ? "over" : percentage >= 80 ? "near" : "healthy",
      };
    });

    return res.json({
      success: true,
      month,
      budgets: items,
      summary: {
        totalBudgeted: toMoney(items.reduce((sum, item) => sum + Number(item.monthlyLimit), 0)),
        totalSpent: toMoney(items.reduce((sum, item) => sum + item.spent, 0)),
        totalExpenses,
        categoriesOverBudget: items.filter((item) => item.status === "over").length,
        categoriesNearLimit: items.filter((item) => item.status === "near").length,
      },
    });
  } catch (error) {
    console.error("Get budgets error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load budgets" });
  }
};

export const createBudget = async (req, res) => {
  try {
    const category = String(req.body.category || "").trim();
    const month = String(req.body.month || "");
    const monthlyLimit = Number(req.body.monthlyLimit);

    if (!category || category.length > 50 || !isValidMonth(month) || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a category, valid month, and monthly limit greater than zero",
      });
    }

    const key = categoryKey(category);
    const existing = await Budget.findOne({ user: req.user._id, month, categoryKey: key });
    if (existing) {
      return res.status(409).json({ success: false, message: "A budget already exists for this category and month" });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      categoryKey: key,
      month,
      monthlyLimit: toMoney(monthlyLimit),
    });

    return res.status(201).json({ success: true, message: "Budget created", budget });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "A budget already exists for this category and month" });
    }
    console.error("Create budget error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create budget" });
  }
};

export const updateBudget = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid budget ID" });
    }
    const monthlyLimit = Number(req.body.monthlyLimit);
    if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      return res.status(400).json({ success: false, message: "Monthly limit must be greater than zero" });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { monthlyLimit: toMoney(monthlyLimit) } },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });

    return res.json({ success: true, message: "Budget updated", budget });
  } catch (error) {
    console.error("Update budget error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update budget" });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid budget ID" });
    }
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
    return res.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    console.error("Delete budget error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete budget" });
  }
};

export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ status: 1, targetDate: 1, createdAt: -1 }).lean();
    const items = goals.map((goal) => ({
      ...goal,
      progress: goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0,
      remaining: toMoney(Math.max(0, goal.targetAmount - goal.currentAmount)),
    }));
    return res.json({
      success: true,
      goals: items,
      summary: {
        targetTotal: toMoney(items.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0)),
        savedTotal: toMoney(items.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0)),
        activeGoals: items.filter((goal) => goal.status === "active").length,
      },
    });
  } catch (error) {
    console.error("Get savings goals error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load savings goals" });
  }
};

export const createSavingsGoal = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const targetAmount = Number(req.body.targetAmount);
    let targetDate = null;

    if (!name || name.length > 80 || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a goal name and target amount greater than zero" });
    }
    if (req.body.targetDate) {
      targetDate = new Date(req.body.targetDate);
      if (Number.isNaN(targetDate.getTime())) {
        return res.status(400).json({ success: false, message: "Enter a valid target date" });
      }
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name,
      targetAmount: toMoney(targetAmount),
      targetDate,
    });
    return res.status(201).json({ success: true, message: "Savings goal created", goal });
  } catch (error) {
    console.error("Create savings goal error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create savings goal" });
  }
};

export const addGoalContribution = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid goal ID" });
    }
    const amount = Number(req.body.amount);
    const note = String(req.body.note || "").trim().slice(0, 160);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Contribution must be greater than zero" });
    }

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        $inc: { currentAmount: toMoney(amount) },
        $push: { contributions: { amount: toMoney(amount), note, date: new Date() } },
      },
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });

    if (goal.currentAmount >= goal.targetAmount && goal.status !== "completed") {
      goal.status = "completed";
      await goal.save();
    }
    return res.status(201).json({ success: true, message: "Contribution added", goal });
  } catch (error) {
    console.error("Add goal contribution error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to add contribution" });
  }
};

export const deleteSavingsGoal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid goal ID" });
    }
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });
    return res.json({ success: true, message: "Savings goal deleted" });
  } catch (error) {
    console.error("Delete savings goal error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete savings goal" });
  }
};


const addFrequency = (dateValue, frequency) => {
  const date = new Date(dateValue);
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
    return date;
  }
  if (frequency === "yearly") {
    const originalMonth = date.getMonth();
    date.setFullYear(date.getFullYear() + 1);
    if (date.getMonth() !== originalMonth) date.setDate(0);
    return date;
  }
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
};

export const getRecurringBills = async (req, res) => {
  try {
    const bills = await RecurringBill.find({ user: req.user._id })
      .populate("account", "name type institution last4")
      .sort({ status: 1, nextDueDate: 1, createdAt: -1 })
      .lean();
    const now = new Date();
    const items = bills.map((bill) => {
      const due = new Date(bill.nextDueDate);
      const daysUntilDue = Math.ceil((new Date(due.getFullYear(), due.getMonth(), due.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
      return {
        ...bill,
        daysUntilDue,
        dueState: bill.status === "paused" ? "paused" : daysUntilDue < 0 ? "overdue" : daysUntilDue <= 3 ? "due_soon" : "upcoming",
      };
    });
    return res.json({
      success: true,
      bills: items,
      summary: {
        activeCount: items.filter((bill) => bill.status === "active").length,
        monthlyEquivalent: toMoney(items.filter((bill) => bill.status === "active").reduce((sum, bill) => {
          const multiplier = bill.frequency === "weekly" ? 52 / 12 : bill.frequency === "yearly" ? 1 / 12 : 1;
          return sum + Number(bill.amount) * multiplier;
        }, 0)),
        overdueCount: items.filter((bill) => bill.dueState === "overdue").length,
      },
    });
  } catch (error) {
    console.error("Get recurring bills error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load recurring bills" });
  }
};

export const createRecurringBill = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "Bills & Utilities").trim();
    const amount = Number(req.body.amount);
    const frequency = String(req.body.frequency || "monthly");
    const nextDueDate = new Date(req.body.nextDueDate);
    const notes = String(req.body.notes || "").trim();
    const allowedFrequencies = ["weekly", "monthly", "yearly"];

    if (!name || name.length > 80 || !category || category.length > 50 || !Number.isFinite(amount) || amount <= 0 || !allowedFrequencies.includes(frequency) || !req.body.nextDueDate || Number.isNaN(nextDueDate.getTime())) {
      return res.status(400).json({ success: false, message: "Enter a name, category, valid amount, frequency and next due date" });
    }
    if (notes.length > 240) return res.status(400).json({ success: false, message: "Notes must be 240 characters or fewer" });

    const bill = await RecurringBill.create({
      user: req.user._id,
      name,
      category,
      amount: toMoney(amount),
      frequency,
      nextDueDate,
      notes,
    });
    return res.status(201).json({ success: true, message: "Recurring bill created", bill });
  } catch (error) {
    console.error("Create recurring bill error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create recurring bill" });
  }
};

export const markRecurringBillPaid = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bill ID" });
    }
    if (!req.body.dueDate || Number.isNaN(new Date(req.body.dueDate).getTime())) {
      return res.status(400).json({ success: false, message: "The scheduled due date is required" });
    }

    let updatedBill;
    let createdTransaction = null;
    await session.withTransaction(async () => {
      const bill = await RecurringBill.findOne({ _id: req.params.id, user: req.user._id, status: "active" }).session(session);
      if (!bill) throw new Error("BILL_NOT_FOUND");

      const expectedDue = new Date(req.body.dueDate);
      if (bill.nextDueDate.getTime() !== expectedDue.getTime()) throw new Error("BILL_DUE_DATE_CHANGED");

      let account = null;
      if (req.body.accountId) {
        if (!mongoose.isValidObjectId(req.body.accountId)) throw new Error("INVALID_ACCOUNT");
        account = await Account.findOne({ _id: req.body.accountId, user: req.user._id, isActive: true }).session(session);
        if (!account) throw new Error("ACCOUNT_NOT_FOUND");

        createdTransaction = new Transaction({
          user: req.user._id,
          account: account._id,
          date: new Date(),
          description: bill.name,
          amount: bill.amount,
          type: "expense",
          category: bill.category,
          source: "manual",
          merchant: bill.name,
          balanceApplied: true,
          isAnomaly: false,
          anomalyScore: 0,
        });
        await createdTransaction.save({ session });
        account.balance = Number(account.balance || 0) + (account.type === "credit_card" ? bill.amount : -bill.amount);
        await account.save({ session });
      }

      const paidAt = new Date();
      bill.paymentHistory.push({
        amount: bill.amount,
        paidAt,
        scheduledDueDate: bill.nextDueDate,
        transaction: createdTransaction?._id || null,
        account: account?._id || null,
      });
      bill.lastPaidAt = paidAt;
      bill.lastPaidDueDate = bill.nextDueDate;

      let nextDue = addFrequency(bill.nextDueDate, bill.frequency);
      while (nextDue <= paidAt) nextDue = addFrequency(nextDue, bill.frequency);
      bill.nextDueDate = nextDue;
      if (account) bill.account = account._id;
      updatedBill = await bill.save({ session });
    });

    return res.json({
      success: true,
      message: createdTransaction ? "Bill marked paid and expense transaction recorded" : "Bill marked paid",
      bill: updatedBill,
      transaction: createdTransaction,
    });
  } catch (error) {
    if (error.message === "BILL_NOT_FOUND") return res.status(404).json({ success: false, message: "Active recurring bill not found" });
    if (error.message === "BILL_DUE_DATE_CHANGED") return res.status(409).json({ success: false, message: "This bill's due date has changed. Refresh and try again." });
    if (error.message === "INVALID_ACCOUNT") return res.status(400).json({ success: false, message: "Invalid account ID" });
    if (error.message === "ACCOUNT_NOT_FOUND") return res.status(404).json({ success: false, message: "Account not found" });
    console.error("Mark recurring bill paid error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to mark bill as paid" });
  } finally {
    await session.endSession();
  }
};

export const updateRecurringBillStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid bill ID" });
    const status = req.body.status;
    if (!["active", "paused"].includes(status)) return res.status(400).json({ success: false, message: "Status must be active or paused" });
    const bill = await RecurringBill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!bill) return res.status(404).json({ success: false, message: "Recurring bill not found" });
    return res.json({ success: true, message: status === "paused" ? "Bill reminders paused" : "Bill reminders resumed", bill });
  } catch (error) {
    console.error("Update recurring bill status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update recurring bill" });
  }
};

export const deleteRecurringBill = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid bill ID" });
    const bill = await RecurringBill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!bill) return res.status(404).json({ success: false, message: "Recurring bill not found" });
    return res.json({ success: true, message: "Recurring bill deleted" });
  } catch (error) {
    console.error("Delete recurring bill error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete recurring bill" });
  }
};
