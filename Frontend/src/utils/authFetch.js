
import { toast } from "sonner";

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,

    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeChatId");

    toast.error(
      "Your session has expired. Please sign in again."
    );

    window.location.href = "/login";

    return null;
  }

  return response;
};