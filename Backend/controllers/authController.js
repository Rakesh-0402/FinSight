import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import Transaction from "../models/Transaction.js";
import UploadHistory from "../models/UploadHistory.js";
import Notification from "../models/Notification.js";
import Chat from "../models/Chat.js";

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};


// SIGNUP
export const signup = async (req, res) => {
  try {
    const {name,email, password} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const existingUser =
      await User.findOne({
        email: email.toLowerCase(),
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password,12);

    const user =
      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const {email,password} = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
        email: email.toLowerCase(),
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches =await bcrypt.compare(password,user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token =generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:",error);

    res.status(500).json({
      success: false,
      message:"Failed to login",
    });
  }
};

//profile controller
export const getProfile = async (req,res) => {
  try {
    const user = await User.findById(
      req.user._id
    ).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

export const updateProfile = async (req,res) => {
  try {
    const {name,email,currency,theme} = req.body;

    const existingUser =
      await User.findOne({
        email: email?.toLowerCase(),
        _id: {
          $ne: req.user._id,
        },
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:"Email already in use",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email.toLowerCase();
    }
    if (currency) {
      user.settings.currency = currency;
    }
    if (theme) {
      user.settings.theme =theme;
    }

    await user.save();

    res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
    });
  }
};

//change password
export const changePassword = async (req,res) => {
  try {
    const {currentPassword,newPassword} = req.body;

    if (
      !currentPassword ||!newPassword) {
      return res.status(400).json({
        success: false,
        message:"Both passwords are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:"Password must be at least 6 characters",
      });
    }

    const user = await User.findById(
        req.user._id
      );

    const matches =await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword,12);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:"Failed to change password",
    });
  }
};

//forgot password
export const forgotPassword =
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const user =
        await User.findOne({
          email:email.trim().toLowerCase(),
        });

      // Do not reveal whether
      // an account exists.
      if (!user) {
        return res.status(200).json({
          message:"If an account exists with that email, a password reset link has been sent.",
        });
      }

      // Generate secure random token
      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      // Store only hashed version
      const hashedToken =
        crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

      user.passwordResetToken = hashedToken;

      user.passwordResetExpires =
        Date.now() +
        15 * 60 * 1000;

      await user.save();

      const resetUrl =
        `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      const html = `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 560px;
          margin: 0 auto;
          padding: 30px;
          color: #07111F;
        ">

          <h2 style="
            margin-bottom: 8px;
          ">
            Reset your FinSight password
          </h2>

          <p style="
            color: #64748b;
            line-height: 1.6;
          ">
            We received a request to reset
            your FinSight account password.
          </p>

          <p style="
            color: #64748b;
            line-height: 1.6;
          ">
            Click the button below to create
            a new password.
          </p>

          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              margin-top: 18px;
              background: #07111F;
              color: white;
              padding: 13px 22px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: 600;
            "
          >
            Reset password
          </a>

          <p style="
            margin-top: 24px;
            color: #64748b;
            font-size: 14px;
          ">
            This link expires in 15 minutes.
          </p>

          <p style="
            color: #64748b;
            font-size: 14px;
          ">
            If you did not request this,
            you can safely ignore this email.
          </p>

        </div>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject:
            "Reset your FinSight password",
          html,
        });
      } catch (emailError) {
        console.error(
          "Password reset email error:",
          emailError
        );

        user.passwordResetToken = null;

        user.passwordResetExpires =null;

        await user.save();

        return res.status(500).json({
          message:
            "Unable to send password reset email",
        });
      }

      return res.status(200).json({
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        message:"Server error",
      });
    }
  };

  //reset password
  export const resetPassword =async (req, res) => {
    try {
      const { token } =req.params;

      const { password } =req.body;

      if (!password) {
        return res.status(400).json({
          message:"New password is required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:"Password must be at least 6 characters",
        });
      }

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      const user = await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpires: {$gt: Date.now()},
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        return res.status(400).json({
          message:"Password reset link is invalid or has expired",
        });
      }

      const hashedPassword = await bcrypt.hash(password,10);

      user.password =hashedPassword;

      user.passwordResetToken = null;

      user.passwordResetExpires =null;

      await user.save();

      return res.status(200).json({
        message:"Password reset successfully",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  };

  //full account deletion endpoint 
  export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      Transaction.deleteMany({user: userId}),

      UploadHistory.deleteMany({user: userId}),

      Notification.deleteMany({user: userId}),

      Chat.deleteMany({user: userId}),
    ]);

    await User.deleteOne({
      _id: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Account and associated data deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete account error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};