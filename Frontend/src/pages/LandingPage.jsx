import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  IndianRupee,
  LineChart,
  LockKeyhole,
  Menu,
  Moon,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingUp,
  UploadCloud,
  WalletCards,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useTheme,
} from "../context/ThemeContext";

export default function Landing() {
  const navigate = useNavigate();

  const {
    resolvedTheme,
    setTheme,
  } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [activeFeature, setActiveFeature] =
    useState("analytics");

  const [demoQuestion, setDemoQuestion] =
    useState("Where did I spend the most?");

  const token =
    localStorage.getItem("token");

  const isAuthenticated =
    Boolean(token);

  const features = {
    analytics: {
      label: "Analytics",
      icon: BarChart3,
      badge: "Understand your spending",
      title:
        "See where every rupee actually goes.",
      description:
        "FinSight transforms raw transactions into clear spending patterns, category breakdowns and monthly trends.",
    },

    forecast: {
      label: "Forecasting",
      icon: TrendingUp,
      badge: "Look ahead",
      title:
        "Know what your spending could look like next.",
      description:
        "Use your historical expense patterns to estimate future spending and prepare before the month gets expensive.",
    },

    anomaly: {
      label: "Anomalies",
      icon: ShieldAlert,
      badge: "Spot unusual activity",
      title:
        "Find transactions that don't match your normal behavior.",
      description:
        "FinSight highlights unusual spending patterns so you can inspect them quickly. Anomalies are signals, not automatic fraud claims.",
    },

    assistant: {
      label: "AI Assistant",
      icon: Bot,
      badge: "Ask your finances",
      title:
        "Talk to your financial data naturally.",
      description:
        "Ask questions about expenses, categories, unusual spending and recent trends instead of manually searching through reports.",
    },
  };

  const assistantAnswers = {
    "Where did I spend the most?":
      "Your highest spending category this month is **Rent at ₹18,000**, followed by **Groceries at ₹7,240**.",

    "How much did I save?":
      "With demo income of **₹82,500** and expenses of **₹47,840**, estimated savings are **₹34,660**.",

    "Any unusual transactions?":
      "I found **2 unusual demo transactions** based on spending patterns. One is a ₹6,450 electronics purchase that is much higher than your usual shopping activity.",

    "What increased this month?":
      "**Dining increased by 24%** compared with the previous demo month, while transportation remained relatively stable.",
  };

  const active =
    features[activeFeature];

  const ActiveFeatureIcon =
    active.icon;

  const suggestedQuestions = [
    "Where did I spend the most?",
    "How much did I save?",
    "Any unusual transactions?",
    "What increased this month?",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F4EC] text-[#07111F] transition-colors dark:bg-[#06101d] dark:text-white">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F7F4EC]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#06101d]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Brand */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07111F] text-sm font-bold text-white dark:bg-white dark:text-[#07111F]">
              FI
            </div>

            <div>
              <p className="font-bold tracking-tight">
                FinSight
              </p>

              <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block dark:text-slate-400">
                Financial Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop nav */}

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex dark:text-slate-300">
            <a
              href="#features"
              className="transition hover:text-[#07111F] dark:hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-[#07111F] dark:hover:text-white"
            >
              How it works
            </a>

            <a
              href="#assistant"
              className="transition hover:text-[#07111F] dark:hover:text-white"
            >
              AI Assistant
            </a>

            <a
              href="#security"
              className="transition hover:text-[#07111F] dark:hover:text-white"
            >
              Security
            </a>
          </nav>

          {/* Desktop actions */}

          <div className="hidden items-center gap-2 lg:flex">

            <button
              onClick={() =>
                setTheme(
                  resolvedTheme === "dark"
                    ? "light"
                    : "dark"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              title="Toggle theme"
            >
              {resolvedTheme ===
              "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="rounded-xl bg-[#07111F] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-[#07111F]"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="rounded-xl bg-[#07111F] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-[#07111F]"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() =>
                setTheme(
                  resolvedTheme === "dark"
                    ? "light"
                    : "dark"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
            >
              {resolvedTheme ===
              "dark" ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

            <button
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}

        {mobileMenuOpen && (
          <div className="border-t border-black/5 bg-[#F7F4EC] px-4 py-5 lg:hidden dark:border-white/10 dark:bg-[#06101d]">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">

              <a
                href="#features"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                How it works
              </a>

              <a
                href="#assistant"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                AI Assistant
              </a>

              <a
                href="#security"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                Security
              </a>

              {isAuthenticated ? (
                <button
                  onClick={() =>
                    navigate(
                      "/dashboard"
                    )
                  }
                  className="mt-2 rounded-xl bg-[#07111F] px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-[#07111F]"
                >
                  Go to Dashboard
                </button>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-semibold dark:border-white/10"
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    className="rounded-xl bg-[#07111F] px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-[#07111F]"
                  >
                    Start Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="relative overflow-hidden">
        <div className="absolute left-[-160px] top-40 h-80 w-80 rounded-full bg-[#16C79A]/20 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-96 w-96 rounded-full bg-[#4F6BFF]/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-32">

          {/* Copy */}

          <div className="relative z-10">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#16C79A]/30 bg-[#16C79A]/10 px-4 py-2 text-sm font-semibold text-[#087f65] dark:text-[#52e2bc]">
              <Sparkles size={16} />

              Built for smarter personal finance
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[82px]">
              Understand
              <span className="block text-[#4F6BFF]">
                every rupee.
              </span>
              Before it
              disappears.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              FinSight turns your
              transactions into spending
              patterns, forecasts, unusual
              activity signals and clear
              answers about your money.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              {isAuthenticated ? (
                <button
                  onClick={() =>
                    navigate(
                      "/dashboard"
                    )
                  }
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-6 py-4 font-semibold text-white shadow-xl shadow-black/10 transition hover:-translate-y-1 dark:bg-white dark:text-[#07111F]"
                >
                  Open your dashboard

                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              ) : (
                <Link
                  to="/signup"
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-6 py-4 font-semibold text-white shadow-xl shadow-black/10 transition hover:-translate-y-1 dark:bg-white dark:text-[#07111F]"
                >
                  Start with FinSight

                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              )}

              <a
                href="#features"
                className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/60 px-6 py-4 font-semibold backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Explore features

                <ChevronRight
                  size={18}
                />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#16C79A]"
                />
                INR-first experience
              </div>

              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#16C79A]"
                />
                CSV transaction import
              </div>

              <div className="flex items-center gap-2">
                <Check
                  size={16}
                  className="text-[#16C79A]"
                />
                AI-powered insights
              </div>
            </div>
          </div>

          {/* Product Demo */}

          <div className="relative mx-auto w-full max-w-xl">

            {/* Floating chip */}

            <div className="absolute -left-3 top-10 z-20 hidden rotate-[-6deg] rounded-2xl bg-[#FFB547] px-4 py-3 shadow-xl sm:block lg:-left-10">
              <p className="text-xs font-bold uppercase tracking-wide text-[#422900]">
                Groceries
              </p>

              <p className="font-bold text-[#422900]">
                ₹7,240
              </p>
            </div>

            <div className="absolute -right-3 top-24 z-20 hidden rotate-[7deg] rounded-2xl bg-[#ff7897] px-4 py-3 shadow-xl sm:block lg:-right-8">
              <p className="text-xs font-bold uppercase tracking-wide text-[#4b1020]">
                Dining
              </p>

              <p className="font-bold text-[#4b1020]">
                ₹5,420
              </p>
            </div>

            <div className="absolute -bottom-3 left-5 z-20 hidden rotate-[5deg] rounded-2xl bg-[#8de7d0] px-4 py-3 shadow-xl sm:block">
              <p className="text-xs font-bold uppercase tracking-wide text-[#053c31]">
                Transport
              </p>

              <p className="font-bold text-[#053c31]">
                ₹3,180
              </p>
            </div>

            {/* Main card */}

            <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[#07111F] p-5 shadow-[0_40px_100px_rgba(7,17,31,0.25)] sm:p-7 dark:border-white/10">

              <div className="absolute right-[-100px] top-[-100px] h-64 w-64 rounded-full bg-[#4F6BFF]/30 blur-3xl" />

              <div className="absolute bottom-[-100px] left-[-80px] h-64 w-64 rounded-full bg-[#16C79A]/20 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">
                      Demo financial view
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-white">
                      September
                    </h3>
                  </div>

                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70">
                    Demo data
                  </div>
                </div>

                {/* Summary */}

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/50">
                      Income
                    </p>

                    <p className="mt-2 text-lg font-bold text-white">
                      ₹82,500
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-white/50">
                      Spent
                    </p>

                    <p className="mt-2 text-lg font-bold text-white">
                      ₹47,840
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-[#16C79A] p-4 sm:col-span-1">
                    <p className="text-xs text-[#063d32]/70">
                      Saved
                    </p>

                    <p className="mt-2 text-lg font-black text-[#063d32]">
                      ₹34,660
                    </p>
                  </div>
                </div>

                {/* Fake chart */}

                <div className="mt-5 rounded-3xl bg-white p-5">

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Monthly spending
                      </p>

                      <p className="mt-1 text-2xl font-bold text-[#07111F]">
                        ₹47,840
                      </p>
                    </div>

                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      ↓ 8.4%
                    </div>
                  </div>

                  <div className="mt-8 flex h-28 items-end gap-2">

                    {[42, 60, 38, 74, 55, 82, 68, 46, 72, 58, 88, 66].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-md bg-[#4F6BFF]/20"
                          style={{
                            height: `${height}%`,
                          }}
                        >
                          <div
                            className="h-full rounded-t-md bg-[#4F6BFF] transition-all duration-500"
                            style={{
                              opacity:
                                0.4 +
                                index *
                                  0.045,
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* AI insight */}

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFB547] text-[#422900]">
                      <Sparkles
                        size={17}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                        FinSight insight
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white">
                        Dining spending is
                        <span className="font-bold text-[#FFB547]">
                          {" "}
                          24% higher{" "}
                        </span>
                        than your 3-month
                        demo average.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          TRUST STRIP
      ========================= */}

      <section className="border-y border-black/5 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl divide-y divide-black/5 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8 dark:divide-white/10">

          <div className="flex items-center gap-4 py-6 sm:px-6">
            <IndianRupee className="text-[#16C79A]" />

            <div>
              <p className="font-semibold">
                INR-first
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Built around Indian
                personal finance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-6 sm:px-6">
            <LockKeyhole className="text-[#4F6BFF]" />

            <div>
              <p className="font-semibold">
                Account-scoped data
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your financial workspace
                stays tied to your account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-6 sm:px-6">
            <BrainCircuit className="text-[#FFB547]" />

            <div>
              <p className="font-semibold">
                Financial intelligence
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Analytics, ML and AI in one
                place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section
        id="how-it-works"
        className="py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4F6BFF]">
              From transactions to clarity
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Raw financial data should not
              stay raw.
            </h2>

          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {[
              {
                number: "01",
                icon: UploadCloud,
                title: "Upload",
                text: "Import your transaction CSV into your private workspace.",
                accent:
                  "bg-[#4F6BFF]",
              },
              {
                number: "02",
                icon: ReceiptText,
                title: "Categorize",
                text: "Transactions are cleaned and organized into meaningful categories.",
                accent:
                  "bg-[#16C79A]",
              },
              {
                number: "03",
                icon: LineChart,
                title: "Understand",
                text: "Explore trends, categories, forecasts and unusual activity.",
                accent:
                  "bg-[#FFB547]",
              },
              {
                number: "04",
                icon: Bot,
                title: "Ask",
                text: "Use the financial assistant to ask questions about your data.",
                accent:
                  "bg-[#ff7897]",
              },
            ].map(
              ({
                number,
                icon: Icon,
                title,
                text,
                accent,
              }) => (
                <div
                  key={number}
                  className="group relative overflow-hidden rounded-[28px] border border-black/10 bg-white p-6 transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white`}
                  >
                    <Icon
                      size={22}
                    />
                  </div>

                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Step {number}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {text}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================= */}

      <section
        id="features"
        className="bg-[#07111F] py-24 text-white sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8de7d0]">
              One financial workspace
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              More than expense tracking.
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/60">
              FinSight combines analytics,
              forecasting, anomaly detection
              and conversational AI.
            </p>
          </div>

          {/* Tabs */}

          <div className="mt-12 flex gap-2 overflow-x-auto pb-2">

            {Object.entries(
              features
            ).map(
              ([
                key,
                feature,
              ]) => {
                const Icon =
                  feature.icon;

                const selected =
                  activeFeature ===
                  key;

                return (
                  <button
                    key={key}
                    onClick={() =>
                      setActiveFeature(
                        key
                      )
                    }
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      selected
                        ? "bg-white text-[#07111F]"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={17}
                    />

                    {feature.label}
                  </button>
                );
              }
            )}
          </div>

          {/* Feature panel */}

          <div className="mt-8 grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] lg:grid-cols-2">

            <div className="flex flex-col justify-center p-8 sm:p-12">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F6BFF]">
                <ActiveFeatureIcon
                  size={25}
                />
              </div>

              <p className="mt-8 text-sm font-semibold text-[#8de7d0]">
                {active.badge}
              </p>

              <h3 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {active.title}
              </h3>

              <p className="mt-5 max-w-lg leading-7 text-white/60">
                {active.description}
              </p>
            </div>

            {/* Visual */}

            <div className="relative min-h-[430px] bg-[#0b1728] p-6 sm:p-10">

              {activeFeature ===
                "analytics" && (
                <div className="h-full rounded-3xl bg-white p-6 text-[#07111F]">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Spending by category
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        ₹47,840
                      </p>
                    </div>

                    <BarChart3 className="text-[#4F6BFF]" />
                  </div>

                  <div className="mt-8 space-y-5">

                    {[
                      [
                        "Rent",
                        "₹18,000",
                        "76%",
                        "#4F6BFF",
                      ],
                      [
                        "Groceries",
                        "₹7,240",
                        "49%",
                        "#16C79A",
                      ],
                      [
                        "Dining",
                        "₹5,420",
                        "37%",
                        "#FFB547",
                      ],
                      [
                        "Transport",
                        "₹3,180",
                        "25%",
                        "#ff7897",
                      ],
                    ].map(
                      ([
                        label,
                        value,
                        width,
                        color,
                      ]) => (
                        <div
                          key={label}
                        >
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="font-medium">
                              {label}
                            </span>

                            <span className="text-slate-500">
                              {value}
                            </span>
                          </div>

                          <div className="h-2.5 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width,
                                backgroundColor:
                                  color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {activeFeature ===
                "forecast" && (
                <div className="h-full rounded-3xl bg-white p-6 text-[#07111F]">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Expense forecast
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        ₹51,200
                      </p>
                    </div>

                    <TrendingUp className="text-[#16C79A]" />
                  </div>

                  <div className="mt-10 flex h-52 items-end gap-3">

                    {[44, 54, 48, 62, 57, 66, 72].map(
                      (
                        height,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex flex-1 flex-col justify-end"
                        >
                          <div
                            className={`rounded-t-xl ${
                              index >= 5
                                ? "bg-[#16C79A]"
                                : "bg-[#4F6BFF]"
                            }`}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-5 text-xs text-slate-500">
                    <span>
                      ● Historical
                    </span>
                    <span>
                      ● Forecast
                    </span>
                  </div>
                </div>
              )}

              {activeFeature ===
                "anomaly" && (
                <div className="h-full space-y-4 rounded-3xl bg-white p-6 text-[#07111F]">

                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Unusual activity
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        2 signals
                      </p>
                    </div>

                    <ShieldAlert className="text-[#ff7897]" />
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          Electronics Store
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Shopping
                        </p>
                      </div>

                      <p className="font-bold">
                        ₹6,450
                      </p>
                    </div>

                    <p className="mt-4 text-xs font-medium text-red-600">
                      Higher than normal
                      shopping behavior
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          Late Night Dining
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Restaurants
                        </p>
                      </div>

                      <p className="font-bold">
                        ₹2,850
                      </p>
                    </div>

                    <p className="mt-4 text-xs font-medium text-amber-600">
                      Unusual amount for
                      this category
                    </p>
                  </div>
                </div>
              )}

              {activeFeature ===
                "assistant" && (
                <div className="h-full rounded-3xl bg-white p-6 text-[#07111F]">

                  <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07111F] text-white">
                      <Bot
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="font-semibold">
                        Financial Assistant
                      </p>

                      <p className="text-xs text-slate-400">
                        Demo conversation
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">

                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#07111F] px-4 py-3 text-sm text-white">
                      Where did I spend
                      the most?
                    </div>

                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                      Your highest spending
                      category is{" "}
                      <strong>
                        Rent at ₹18,000
                      </strong>
                      , followed by groceries
                      at ₹7,240.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          AI DEMO
      ========================= */}

      <section
        id="assistant"
        className="py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#4F6BFF]/10 px-4 py-2 text-sm font-semibold text-[#4F6BFF]">
              <Bot size={17} />
              Conversational finance
            </div>

            <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Your finances should be
              something you can ask.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Instead of digging through
              tables and charts, ask clear
              questions and get answers based
              on financial context.
            </p>

            <div className="mt-8 space-y-3">

              {suggestedQuestions.map(
                (question) => (
                  <button
                    key={question}
                    onClick={() =>
                      setDemoQuestion(
                        question
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${
                      demoQuestion ===
                      question
                        ? "border-[#4F6BFF] bg-[#4F6BFF]/5 text-[#4F6BFF]"
                        : "border-black/10 bg-white/50 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {question}

                    <ChevronRight
                      size={17}
                    />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Fake assistant */}

          <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-white/5">

            <div className="rounded-[26px] bg-[#07111F] p-5 sm:p-7">

              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#16C79A] text-[#063d32]">
                  <Sparkles
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-white">
                    FinSight AI
                  </p>

                  <p className="text-xs text-white/40">
                    Demo data only
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-5">

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm font-medium text-[#07111F]">
                  {demoQuestion}
                </div>

                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white/10 px-5 py-4 text-sm leading-7 text-white/80">
                  {assistantAnswers[
                    demoQuestion
                  ]}
                </div>
              </div>

              <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/40">
                Ask your financial data...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          INDIA-FIRST
      ========================= */}

      <section className="px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[#4F6BFF] text-white">

          <div className="grid lg:grid-cols-[1.1fr_.9fr]">

            <div className="p-8 sm:p-12 lg:p-16">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                Designed with India in mind
              </p>

              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
                Personal financial
                intelligence that speaks in
                ₹.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
                FinSight focuses on the
                financial patterns Indian
                users actually see: bank
                statements, recurring
                expenses, subscriptions,
                categories and spending
                behavior.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">

                {[
                  "INR-first financial views",
                  "CSV-based bank transaction imports",
                  "Expense categorization",
                  "Recurring spending awareness",
                  "Forecasting from spending history",
                  "Financial AI assistant",
                ].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <Check
                          size={14}
                        />
                      </div>

                      <span className="text-sm text-white/80">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden bg-[#16C79A] p-8 text-[#063d32] sm:p-12">

              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[40px] border-white/20" />

              <div className="relative flex h-full flex-col justify-end">

                <IndianRupee
                  size={56}
                  strokeWidth={2.4}
                />

                <p className="mt-8 text-5xl font-black tracking-tight sm:text-6xl">
                  ₹34,660
                </p>

                <p className="mt-2 text-lg font-semibold">
                  Demo savings this month
                </p>

                <p className="mt-4 max-w-sm leading-7 text-[#063d32]/70">
                  Understand income,
                  expenses and savings
                  without translating a
                  dollar-first experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SECURITY
      ========================= */}

      <section
        id="security"
        className="border-y border-black/5 bg-white/60 py-24 dark:border-white/10 dark:bg-white/[0.03]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid gap-12 lg:grid-cols-2">

            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
                <LockKeyhole
                  size={25}
                />
              </div>

              <h2 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl">
                Financial intelligence
                should still feel private.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                FinSight keeps authenticated
                financial data scoped to the
                signed-in account throughout
                the application.
              </p>
            </div>

            <div className="grid gap-4">

              {[
                {
                  icon: LockKeyhole,
                  title:
                    "Authenticated access",
                  text:
                    "Protected routes require signed-in access before private financial information is available.",
                },
                {
                  icon: WalletCards,
                  title:
                    "User-scoped transactions",
                  text:
                    "Transaction queries are associated with the authenticated user's account.",
                },
                {
                  icon: ShieldAlert,
                  title:
                    "Responsible anomaly signals",
                  text:
                    "Unusual activity is presented as a spending anomaly, not automatically labeled as fraud.",
                },
              ].map(
                ({
                  icon: Icon,
                  title,
                  text,
                }) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-3xl border border-black/10 bg-[#F7F4EC] p-5 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/10">
                      <Icon
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="font-bold">
                        {title}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {text}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[#FFB547] p-8 text-[#422900] sm:p-12 lg:p-16">

          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">

            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-60">
                Better visibility starts here
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                Make your money easier to
                understand.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 opacity-75">
                Turn transactions into
                insights, trends, forecasts
                and conversations.
              </p>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="group flex shrink-0 items-center gap-2 rounded-2xl bg-[#07111F] px-6 py-4 font-semibold text-white transition hover:-translate-y-1"
              >
                Go to Dashboard

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </button>
            ) : (
              <Link
                to="/signup"
                className="group flex shrink-0 items-center gap-2 rounded-2xl bg-[#07111F] px-6 py-4 font-semibold text-white transition hover:-translate-y-1"
              >
                Start Free

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="border-t border-black/5 px-4 py-10 dark:border-white/10 sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07111F] text-sm font-bold text-white dark:bg-white dark:text-[#07111F]">
              FI
            </div>

            <div>
              <p className="font-bold">
                FinSight
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personal Financial
                Intelligence
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()}{" "}
            FinSight. Built for clearer
            financial decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}