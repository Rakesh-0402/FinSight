import { API_URL } from "@/lib/utils";
import {useState} from "react";
import { resetPasswordSchema } from "@/schemas/authSchema";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  WalletCards,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setLoading(true);

      try {
        const result = resetPasswordSchema.safeParse({
          password,
          confirmPassword,
        });

        if (!result.success) {
          const firstError = result.error.issues[0]?.message;

          toast.error(firstError || "Please check your inputs");
          return;
        }
        const {confirmPassword: _confirmPassword , ...resetData} = result.data;

        const response =
          await fetch(
            `${API_URL}/api/auth/reset-password/${token}`,
            {
              method: "POST",

              headers: {
                "Content-Type":"application/json",
              },

              body: JSON.stringify(resetData),
            }
          );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ||"Unable to reset password");
        }

        toast.success("your password has been successfully reset")
        navigate("/login",
          {
            replace: true,
            state: {
              passwordReset: true,
            },
          }
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] px-4 py-10 text-[#07111F] transition-colors dark:bg-[#06101d] dark:text-white">

      <div className="w-full max-w-md">

        <Link
          to="/"
          className="mb-8 flex w-fit items-center gap-2.5 sm:mb-10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
            <WalletCards size ={18}/> 
          </div>
       
          <span className="font-bold tracking-tight">FinSight</span>
        </Link>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16C79A]/15 text-[#087f65] dark:text-[#52e2bc]">
          <LockKeyhole
            size={22}
          />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.17em] text-[#4F6BFF]">
          New password
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
          Reset your password.
        </h1>

        <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
          Choose a new password for your FinSight account.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-5"
        >

          {/* New Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              New password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword ? "text": "password"}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                placeholder="Enter new password"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff
                    size={20}
                  />
                ) : (
                  <Eye
                    size={20}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Confirm */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Confirm password
            </label>

            <div className="relative">
              <input
                type={
                  showConfirmPassword ? "text": "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                placeholder="Confirm new password"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff
                    size={20}
                  />
                ) : (
                  <Eye
                    size={20}
                  />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] py-3.5 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#07111F]"
          >
            {loading ? "Resetting..." : "Reset password"}

            {!loading && (
              <ArrowRight
                size={18}
              />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}