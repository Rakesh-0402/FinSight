import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { authFetch } from "@/utils/authFetch";
import {
  Bell,
  CheckCheck,
  FileSpreadsheet,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NotificationsBell = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchNotifications = async () => {
    try {
      const response = await authFetch(
        `${API_URL}/api/notifications`,
      );

      if (!response) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notifications"
        );
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {

      console.error("Fetch notifications error:",error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notification) => {
    try {
      if (!notification.isRead) {
        const response = await authFetch(
          `${API_URL}/api/notifications/${notification._id}/read`,
          {
            method: "PATCH",
          }
        );

        if (!response) return;

        if (response.ok) {
          setNotifications((current) =>
            current.map((item) =>
              item._id === notification._id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
            )
          );

          setUnreadCount((count) =>Math.max(0, count - 1));
        }
      }

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await authFetch(
        `${API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
        }
      );
      if (!response) return;

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  };

  //delete individual notification
  const deleteNotification = async (e,notificationId) => {
    e.stopPropagation();

    try {
      const response = await authFetch(
        `${API_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );
      if (!response){
        return;
      }

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      const deletedNotification =
        notifications.find(
          (notification) =>
            notification._id === notificationId
        );

      if (
        deletedNotification &&
        !deletedNotification.isRead
      ) {
        setUnreadCount((count) =>Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Delete notification error:",error);
    }
  };

  //delete all notifications
const clearAllNotifications = async () => {
  try {
    const response = await authFetch(   //authFetch already sends jwt token in headers
      `${API_URL}/api/notifications`,
      {
        method: "DELETE",
      }
    );
    if (!response) {
      return;
    }

    if (!response.ok) {
      return;
    }

    setNotifications([]);
    setUnreadCount(0);
  } catch (error) {
    console.error("Clear notifications error:",error);
  }
};
  const getIcon = (type) => {
    if (type === "anomaly") {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#F45B69] dark:bg-red-950/30">
          <TriangleAlert className="size-4" />
        </div>
      );
    }

    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#4F6BFF] dark:bg-blue-950/30">
        <FileSpreadsheet className="size-4" />
      </div>
    );
  };

   const formatTime = (date) => {
    const createdAt = new Date(date);
    const now = new Date();

    const difference =now.getTime() - createdAt.getTime();

    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#F45B69] px-1.5 text-[10px] font-bold leading-5 text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] rounded-2xl p-0 sm:w-[400px]"
      >
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <h3 className="font-semibold text-[#07111F] dark:text-white">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1
                        ? "s"
                        : ""
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 gap-1.5 text-xs text-[#4F6BFF]"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}

              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-8 text-xs text-slate-500 hover:text-red-500"
                >
                  Clear all
                </Button>
              )}
          </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Bell className="size-5 text-slate-500" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Important financial updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    onClick={() =>markAsRead(notification)}
                    className="cursor-pointer rounded-none p-0"
                  >
                    <div
                      className={`flex w-full gap-3 px-4 py-3.5 ${
                        !notification.isRead
                          ? "bg-blue-50/60 dark:bg-blue-950/10"
                          : ""
                      }`}
                    >
                      {getIcon(notification.type)}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">
                            {notification.title}
                          </p>

                          {!notification.isRead && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#4F6BFF]" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>

                        <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* delete notification icon*/}
                      <button
                        type="button"
                        onClick={(e) =>deleteNotification(e,notification._id)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                        <X className="size-4.5" />
                    </button>
                    </div>
                  </DropdownMenuItem>
                )
              )
            )}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default NotificationsBell;