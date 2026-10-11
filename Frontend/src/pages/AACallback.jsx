import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

const AACallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState(
    "Completing bank connection..."
  );

  useEffect(() => {
    const finishConnection = async () => {
      try {
        const success =
          searchParams.get("success");

        const callbackConsentId =
          searchParams.get("id");

        const consentId =
          callbackConsentId ||
          localStorage.getItem(
            "aaConsentId"
          );

        if (
          success !== "true" ||
          !consentId
        ) {
          throw new Error(
            "Bank connection was cancelled or failed"
          );
        }

        // 1. Verify consent
        setMessage(
          "Verifying consent..."
        );

        const consentResponse =
          await authFetch(
            `${API_URL}/api/account-aggregator/consent/${consentId}`
          );

        if (!consentResponse) return;

        const consentData =
          await consentResponse.json();

        if (!consentResponse.ok) {
          throw new Error(
            consentData.message ||
              "Failed to verify consent"
          );
        }

        if (
          consentData.consent?.status !==
          "ACTIVE"
        ) {
          throw new Error(
            `Consent is ${consentData.consent?.status}`
          );
        }

        // 2. Create data session
        setMessage(
          "Requesting bank data..."
        );

        const sessionResponse =
          await authFetch(
            `${API_URL}/api/account-aggregator/session`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                consentId,
              }),
            }
          );

        if (!sessionResponse) return;

        const sessionData =
          await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(
            sessionData.message ||
              "Failed to create data session"
          );
        }

        const sessionId =
          sessionData.session?.id;

        if (!sessionId) {
          throw new Error(
            "Session ID not received"
          );
        }

        // 3. Poll until data is ready
        setMessage(
          "Fetching bank transactions..."
        );

        let ready = false;

        for (
          let attempt = 0;
          attempt < 10;
          attempt++
        ) {
          const statusResponse =
            await authFetch(
              `${API_URL}/api/account-aggregator/session/${sessionId}`
            );

          if (!statusResponse) return;

          const statusData =
            await statusResponse.json();

          if (!statusResponse.ok) {
            throw new Error(
              statusData.message ||
                "Failed to fetch session"
            );
          }

          const status =
            statusData.session?.status;

          if (
            status === "COMPLETED" ||
            status === "PARTIAL"
          ) {
            ready = true;
            break;
          }

          if (
            status === "FAILED" ||
            status === "ERROR"
          ) {
            throw new Error(
              "Bank data fetch failed"
            );
          }

          await sleep(2000);
        }

        if (!ready) {
          throw new Error(
            "Bank data is taking too long. Please try again."
          );
        }

        // 4. Sync into FinSight
        setMessage(
          "Syncing transactions..."
        );

        const syncResponse =
          await authFetch(
            `${API_URL}/api/account-aggregator/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sessionId,
              }),
            }
          );

        if (!syncResponse) return;

        const syncData =
          await syncResponse.json();

        if (!syncResponse.ok) {
          throw new Error(
            syncData.message ||
              "Failed to sync account"
          );
        }

        localStorage.removeItem(
          "aaConsentId"
        );

        toast.success(
          `Bank connected. ${syncData.transactionsAdded} transactions synced.`
        );

        navigate("/accounts");
      } catch (error) {
        console.error(
          "AA callback error:",
          error
        );

        toast.error(
          error.message ||
            "Failed to connect bank"
        );

        navigate("/accounts");
      }
    };

    finishConnection();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#4F6BFF]" />

        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          {message}
        </p>
      </div>
    </div>
  );
};

export default AACallback;