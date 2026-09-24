import { API_URL } from "@/lib/utils";
import {useState } from "react";
import { forgotPasswordSchema } from "@/schemas/authSchema";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  WalletCards
} from "lucide-react";

import {Link} from "react-router-dom";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = forgotPasswordSchema.safeParse({email});

      if (!result.success) {
        const firstError = result.error.issues[0]?.message;
        toast.error(firstError || "Please enter correct email"
      );

      return;
      }
      const response =
        await fetch(
          `${API_URL}/api/auth/forgot-password`,
          {
            method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify(result.data),
            }
          );
    
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to send reset link");
        }

        setMessage(data.message);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] px-4 py-10 text-[#07111F] transition-colors dark:bg-[#06101d] dark:text-white">

      <div className="w-full max-w-md">

        {/* Brand */}

        <Link
          to="/"
          className="mb-8 flex w-fit items-center gap-2.5 sm:mb-10"
        >

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
          <WalletCards size ={18}/> 
        </div>

        <span className="font-bold tracking-tight">FinSight</span>
        </Link>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF]">
          <Mail size={22} />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.17em] text-[#4F6BFF]">
          Password recovery
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
          Forgot your password?
        </h1>

        <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
          Enter the email associated with your FinSight account and we'll send you a reset link.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] py-3.5 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#07111F]"
          >
            {loading ? "Sending..." : "Send reset link"}

            {!loading && (
              <ArrowRight
                size={18}
              />
            )}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#07111F] dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
}