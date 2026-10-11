import Account from "../models/Account.js";

export const createAccount = async (req, res) => {
  try {
    const {
      name,
      type,
      institution,
      last4,
      balance,
      creditLimit,
      statementDueDate,
    } = req.body;

    const account = await Account.create({
      user: req.user._id,
      name,
      type,
      institution: institution || null,
      last4: last4 || null,
      balance: balance ?? 0,
      creditLimit: creditLimit ?? null,
      statementDueDate: statementDueDate ?? null,
    });

    return res.status(201).json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("Create account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("Update account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update account",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account archived successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};