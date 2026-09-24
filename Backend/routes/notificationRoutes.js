import express from "express";
import Notification from "../models/Notification.js";
import { protectedRoute } from "../middleware/authmiddleware.js";

const router = express.Router();

// GET all notifications for logged-in user
router.get("/", protectedRoute, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

// MARK one notification as read
router.patch("/:id/read", protectedRoute, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
});

// MARK all notifications as read
router.patch("/read-all", protectedRoute, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
});

//delete notification
router.delete("/:id", protectedRoute, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
});
//delete all notifications
router.delete("/", protectedRoute, async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error(
      "Clear notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
});

export default router;