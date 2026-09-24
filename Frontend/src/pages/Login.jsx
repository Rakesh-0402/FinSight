import { API_URL } from "@/lib/utils";
import { useState } from "react";
import { loginSchema } from "@/schemas/authSchema";
import {ArrowRight, WalletCards,Eye, EyeOff} from "lucide-react";
import {Link,useNavigate} from "react-router-dom";
import {useTheme} from "../context/ThemeContext";
import {toast} from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]:
        event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = loginSchema.safeParse({
        email: formData.email,
        password: formData.password,
      });

      if (!result.success) {
        const firstError = result.error.issues[0]?.message;

        toast.error(firstError || "Please check your inputs");
        return;
      }

      //send validated data
      const response = await fetch(
      `${API_URL}/api/auth/login`,
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
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token",data.token);

      localStorage.setItem("user",JSON.stringify(data.user));

      const currentTheme = localStorage.getItem("theme");

      if (!currentTheme) {
        setTheme(data.user?.settings?.theme || "system");
      }

      toast.success("Login Successful");
      navigate("/dashboard");

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#07111F] transition-colors dark:bg-[#06101d] dark:text-white">

        <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">

          <div className="w-full max-w-md">

            {/* Mobile brand */}
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
                Welcome back
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#07111F] dark:text-white sm:text-5xl">
                Continue your financial journey.
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
                Sign in to access your dashboard, transactions, analytics and financial assistant.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 space-y-5"
            >

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
                    w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400
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
                      showPassword? "text": "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="
                      w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-slate-900 outline-none transition
                      placeholder:text-slate-400 focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/10
                      dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="
                      absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition 
                      hover:text-slate-700 dark:text-slate-500 dark:hover:text-white
                    "
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

               <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#4F6BFF] transition hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
             
              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="
                  group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] py-3.5 font-semibold 
                  text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10
                  disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#07111F]
                "
              >
                {loading ? "Logging in..." : "Login"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Signup */}
            <div className="mt-8 border-t border-black/5 pt-6 text-center dark:border-white/10">

              <p className="text-sm text-slate-500 dark:text-slate-400">
                New to FinSight?{" "}

                <Link
                  to="/signup"
                  className="font-semibold text-[#4F6BFF] hover:underline"
                >
                  Create an account
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
      </div>
  );
};
export default Login;