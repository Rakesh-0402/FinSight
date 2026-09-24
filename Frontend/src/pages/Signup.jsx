import { API_URL } from "@/lib/utils";
import { useState } from "react";
import {toast} from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  WalletCards
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {useTheme} from "../context/ThemeContext";

//zod validation
import { signupSchema } from "@/schemas/authSchema";

const Signup = () => {
  const navigate = useNavigate();

  const { setTheme } = useTheme();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      confirmPassword : ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async(event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = signupSchema.safeParse({
        name : formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword : formData.confirmPassword,
      });

      if (!result.success) {
        const firstError = result.error.issues[0]?.message;

        toast.error(firstError || "Please check your inputs");
        return;
      }
      const {confirmPassword , ...signupData} = result.data

      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(signupData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ||"Signup failed");
      }

      //save JWT token in local storage
      localStorage.setItem("token", data.token);

      //save user in local storage
      localStorage.setItem("user", JSON.stringify(data.user));

      const currentTheme = localStorage.getItem("theme");

      if (!currentTheme) {
        setTheme(data.user?.settings?.theme || "system");
      }
      toast.success("Account created successfully!");
      navigate("/dashboard");

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F7F4EC] px-4 py-8 text-[#07111F] transition-colors dark:bg-[#06101d] dark:text-white sm:px-6 sm:py-10">

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

        {/* Header */}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#4F6BFF]">
            Get started
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-[#07111F] dark:text-white sm:text-4xl lg:text-5xl">
            Build a clearer view of your finances.
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:mt-4 sm:text-base sm:leading-7">
            Create your FinSight account and start understanding your transactions, spending patterns and financial insights.
          </p>
        </div>

        {/* Error */}

        {error && (
          <div className="mt-5 break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 sm:mt-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
        >
          {/* NAME */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
              className="
                w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base
                text-slate-900 outline-none transition placeholder:text-slate-400
                focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10
                dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500
              "
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="
                w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base 
                text-slate-900 outline-none transition placeholder:text-slate-400
                focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10
                dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500
              "
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>

            <div className="relative">

              <input
                type={
                  showPassword ? "text" :"password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 8 characters"
                className="
                  w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-14 text-base
                  text-slate-900 outline-none transition placeholder:text-slate-400
                  focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10
                  dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
                title={
                  showPassword? "Hide password": "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/*confirm password*/}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
             Confirm Password
            </label>

            <div className="relative">

              <input
                type={
                  showConfirmPassword? "text": "password"
                }
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                className="
                  w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-14text-base
                  text-slate-900 outline-none transition placeholder:text-slate-400
                  focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10
                  dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
                title={
                  showConfirmPassword? "Hide password": "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="
              group flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 py-3.5 
              text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 
              disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#07111F] sm:text-base
            "
          >
            {loading ? "Creating account..." : "Create account"}

            {!loading && (
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </form>

        {/* Login */}

        <div className="mt-8 border-t border-black/5 pt-6 text-center dark:border-white/10">

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#4F6BFF] hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Back home */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;