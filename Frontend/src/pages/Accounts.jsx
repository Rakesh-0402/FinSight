import { useEffect, useState } from "react";
import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [institution, setInstitution] = useState("");
  const [last4, setLast4] = useState("");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [statementDueDate, setStatementDueDate] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountToArchive, setAccountToArchive] = useState(null);
  const [connectingBank, setConnectingBank] = useState(false);
  const [mobile, setMobile] = useState("");

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      const response = await authFetch(`${API_URL}/api/accounts`);

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load accounts");
      }

      setAccounts(data.accounts || []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: name.trim(),
        type,
        institution: institution.trim() || null,
        last4: last4.trim() || null,
        balance: Number(balance || 0),
      };

      if (type === "credit_card") {
        payload.creditLimit = creditLimit
          ? Number(creditLimit)
          : null;

        payload.statementDueDate = statementDueDate
          ? Number(statementDueDate)
          : null;
      }

      const response = await authFetch(`${API_URL}/api/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      toast.success("Account created successfully");

      setName("");
      setInstitution("");
      setLast4("");
      setBalance("");
      setCreditLimit("");
      setStatementDueDate("");
      setType("bank");

      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create account");
    }
  };

  const handleArchiveAccount = async (accountId) => {
  try {
    const response = await authFetch(
      `${API_URL}/api/accounts/${accountId}`,
      {
        method: "DELETE",
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to archive account");
    }

    toast.success("Account archived");
    fetchAccounts();
  } catch (error) {
    console.error("Archive account failed:", error);
    toast.error(error.message || "Failed to archive account");
  }
};

  const handleUpdateAccount = async (e) => {
  e.preventDefault();

  if (!editingAccount) return;

  try {
    const response = await authFetch(
      `${API_URL}/api/accounts/${editingAccount._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingAccount.name,
          type: editingAccount.type,
          institution: editingAccount.institution || null,
          last4: editingAccount.last4 || null,
          balance: Number(editingAccount.balance || 0),
          creditLimit:
            editingAccount.type === "credit_card"
              ? Number(editingAccount.creditLimit || 0)
              : null,
          statementDueDate:
            editingAccount.type === "credit_card"
              ? Number(editingAccount.statementDueDate || 0) || null
              : null,
        }),
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update account");
    }

    toast.success("Account updated");
    setEditingAccount(null);
    fetchAccounts();
  } catch (error) {
    console.error("Update account failed:", error);
    toast.error(error.message || "Failed to update account");
  }
};
const handleConnectBank = async () => {
  try {
    if (!mobile.trim()) {
      toast.error("Enter your registered mobile number");
      return;
    }

    setConnectingBank(true);

    const response = await authFetch(
      `${API_URL}/api/account-aggregator/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: mobile.trim(),
        }),
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to start bank connection"
      );
    }

    if (!data.url) {
      throw new Error("Consent URL not received");
    }
    //save the consent Id before redirecting
    localStorage.setItem("aaConsentId", data.consentId);

    window.location.href = data.url;
  } catch (error) {
    console.error("Bank connection failed:", error);
    toast.error(
      error.message || "Failed to connect bank"
    );
  } finally {
    setConnectingBank(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
          Accounts
        </h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Manage the financial accounts connected to your FinSight profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <h2 className="text-lg font-bold text-[#07111F] dark:text-white">
            Connect Bank Securely
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Connect your bank through the Account Aggregator sandbox.
          </p>

          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Registered mobile number"
            className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <button
            type="button"
            onClick={handleConnectBank}
            disabled={connectingBank}
            className="mt-4 w-full rounded-2xl bg-[#4F6BFF] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {connectingBank
              ? "Connecting..."
              : "Connect Bank Securely"}
          </button>
        </div>
        {/* ADD ACCOUNT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <h2 className="text-lg font-bold text-[#07111F] dark:text-white">
            Add Account
          </h2>

          <form
            onSubmit={handleCreateAccount}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Account Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SBI Savings"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Account Type
              </label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="bank">Bank</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Institution
              </label>

              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Last 4 digits
              </label>

              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                maxLength={4}
                placeholder="1234"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Current Balance
              </label>

              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="25000"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {type === "credit_card" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Credit Limit
                  </label>

                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="100000"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Statement Due Date
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={statementDueDate}
                    onChange={(e) =>
                      setStatementDueDate(e.target.value)
                    }
                    placeholder="18"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#07111F] px-4 py-3.5 text-sm font-semibold text-white dark:bg-white dark:text-[#07111F]"
            >
              Add Account
            </button>
          </form>
        </div>

        {/* ACCOUNT LIST */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <h2 className="text-lg font-bold text-[#07111F] dark:text-white">
            Your Accounts
          </h2>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">
                Loading accounts...
              </p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No accounts added yet.
              </p>
            ) : (
              accounts.map((account) => (
                <div
                  key={account._id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#07111F] dark:text-white">
                        {account.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {account.institution || account.type}
                        {account.last4
                          ? ` •••• ${account.last4}`
                          : ""}
                      </p>
                    </div>

                    <p className="font-semibold">
                      ₹{Number(account.balance || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                   <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setEditingAccount(account)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Edit
                    </button>

                     <button
                        type="button"
                        onClick={() => setAccountToArchive(account)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                        Archive
                    </button>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>

    {/*Edit Account form*/}
    {editingAccount && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#081321]">
      
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#07111F] dark:text-white">
          Edit Account
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update your account details.
        </p>
      </div>

      <form
        onSubmit={handleUpdateAccount}
        className="space-y-4"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Account Name
          </label>

          <input
            value={editingAccount.name}
            onChange={(e) =>
              setEditingAccount({
                ...editingAccount,
                name: e.target.value,
              })
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Institution
          </label>

          <input
            value={editingAccount.institution || ""}
            onChange={(e) =>
              setEditingAccount({
                ...editingAccount,
                institution: e.target.value,
              })
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Last 4 digits
          </label>

          <input
            value={editingAccount.last4 || ""}
            onChange={(e) =>
              setEditingAccount({
                ...editingAccount,
                last4: e.target.value,
              })
            }
            maxLength={4}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Current Balance
          </label>

          <input
            type="number"
            value={editingAccount.balance}
            onChange={(e) =>
              setEditingAccount({
                ...editingAccount,
                balance: e.target.value,
              })
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {editingAccount.type === "credit_card" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Credit Limit
              </label>

              <input
                type="number"
                value={editingAccount.creditLimit || ""}
                onChange={(e) =>
                  setEditingAccount({
                    ...editingAccount,
                    creditLimit: e.target.value,
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Statement Due Date
              </label>

              <input
                type="number"
                min="1"
                max="31"
                value={editingAccount.statementDueDate || ""}
                onChange={(e) =>
                  setEditingAccount({
                    ...editingAccount,
                    statementDueDate: e.target.value,
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-[#07111F] px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-[#07111F]"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => setEditingAccount(null)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </div>
      {accountToArchive && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#081321]">
      <h2 className="text-xl font-bold text-[#07111F] dark:text-white">
        Archive Account?
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Are you sure you want to archive{" "}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {accountToArchive.name}
        </span>
        ?
      </p>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Historical transactions will remain available, but this account will no longer appear as an active account.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={async () => {
            await handleArchiveAccount(accountToArchive._id);
            setAccountToArchive(null);
          }}
          className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          Archive Account
        </button>

        <button
          type="button"
          onClick={() => setAccountToArchive(null)}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Accounts;