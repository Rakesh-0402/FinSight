import { API_URL } from "@/lib/utils";
import {getDateRange} from "@/utils/dateRange";
import { authFetch } from "@/utils/authFetch";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";

import {
  ArrowRight,
  Bot,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  CalendarRange,
  CalendarIcon,
} from "lucide-react";

import {useEffect,useState} from "react";

import {useNavigate} from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {Badge} from "@/components/ui/badge";

import {Skeleton} from "@/components/ui/skeleton";

import {
  ChartContainer,ChartTooltip, ChartTooltipContent} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import {Calendar} from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {format} from "date-fns";
import { Button } from "@/components/ui/button";

const TIME_RANGE_LABELS = {
  all: "All time",
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "last-6-months": "Last 6 months",
  "this-year": "This year",
  "last-year": "Last year",
  custom: "Custom range",
};

const emptyDateRange = {
  from: undefined,
  to: undefined,
};

const loadSavedCustomRange = () => {
  try {
    const saved = localStorage.getItem("dashboardCustomRange");

    if (!saved) {
      return {
         from: undefined,
        to: undefined,
      };
    }

    const parsed = JSON.parse(saved);
    const from = parsed?.from ? new Date(parsed.from) : undefined;
    const to = parsed?.to ? new Date(parsed.to) : undefined;

    if (
      (from && Number.isNaN(from.getTime())) ||
      (to && Number.isNaN(to.getTime()))
    ) {
      return {
         from: undefined,
        to: undefined,
      };
    }
    return { from, to };
  } catch {
    return {
       from: undefined,
        to: undefined,
    };
  }
};

export default function Dashboard() {
  const getInitialTimeRange = () => {
    const savedRange = localStorage.getItem("dashboardTimeRange");
    const savedCustomRange = loadSavedCustomRange();

    if (!savedRange || !TIME_RANGE_LABELS[savedRange]) {
      return "all";
    }

    if (
      savedRange === "custom" && (!savedCustomRange?.from || !savedCustomRange?.to)
    ) {
      return "all";
    }
    return savedRange;
  };

  const initialTimeRange = getInitialTimeRange();
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [activeTimeRange, setActiveTimeRange] = useState(initialTimeRange);

  const [customDateRange, setCustomDateRange] = useState(
    () => loadSavedCustomRange()
  );
  const [appliedDateRange, setAppliedDateRange] = useState(
    () => loadSavedCustomRange()
  );
  const [customPanelOpen, setCustomPanelOpen] = useState(false);

  const [customFrom, setCustomFrom] =
    useState(() => loadSavedCustomRange()?.from);

  const [customTo, setCustomTo] =
    useState(() => loadSavedCustomRange()?.to);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Persist only the range that is actually applied to the dashboard.
  useEffect(() => {
    localStorage.setItem("dashboardTimeRange", activeTimeRange);
  }, [activeTimeRange]);

  const handleTimeRangeChange = (value) => {
    if (value === "custom") {
      // Show custom editing UI, but keep the currently applied
      // dashboard data unchanged until Apply range is clicked.
      setTimeRange("custom");

      setCustomFrom(appliedDateRange?.from);

      setCustomTo(appliedDateRange?.to);

      setCustomPanelOpen(true);
      return;
    }

    // Preset filters apply immediately.
    setTimeRange(value);
    setActiveTimeRange(value);
    setCustomPanelOpen(false);
  };

  const handleCancelCustomRange = () => {
    // Restore the last applied custom dates.
    setCustomFrom(appliedDateRange?.from);
    setCustomTo(appliedDateRange?.to);

    // Restore the select to the range that is actually active.
    setTimeRange(activeTimeRange);
    setCustomPanelOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) {
      return;
    }

    if (customTo < customFrom) {
      return;
    }

    const nextRange = {
      from: customFrom,
      to: customTo,
    };

    setAppliedDateRange(nextRange);
    setCustomDateRange(nextRange);
    setActiveTimeRange("custom");
    setTimeRange("custom");
    setCustomPanelOpen(false);
  };

  const handleClearCustomRange = () => {
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  useEffect(() => {
    
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const range = getDateRange(
          activeTimeRange,
          appliedDateRange,
        );

        const params = new URLSearchParams();

        if (range) {
          params.set("startDate", range.startDate);
          params.set("endDate", range.endDate);
        }

        const url = params.toString()
          ? `${API_URL}/api/dashboard?${params.toString()}`
          : `${API_URL}/api/dashboard`;

        const response = await authFetch(url);
        
        if (!response) return; 

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }
        setDashboardData(data);

      } catch (error) {
        console.error("Dashboard fetch error:", error);

        setError("Failed to load dashboard data");
        
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, activeTimeRange, appliedDateRange]);

  useEffect(() => {
    if (appliedDateRange?.from && appliedDateRange?.to) {
      localStorage.setItem(
        "dashboardCustomRange",
        JSON.stringify({
          from: appliedDateRange.from.toISOString(),
          to: appliedDateRange.to.toISOString(),
        })
      );
    }
  }, [appliedDateRange]);

  const formatCurrency = (value = 0) =>
    `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatCompactCurrency = (value = 0) => {
    const number = Number(value);

    if (number >= 10000000) {
      return `₹${(
        number / 10000000
      ).toFixed(1)}Cr`;
    }

    if (number >= 100000) {
      return `₹${(
        number / 100000
      ).toFixed(1)}L`;
    }

    if (number >= 1000) {
      return `₹${(
        number / 1000
      ).toFixed(1)}K`;
    }

    return `₹${number}`;
  };

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-3xl"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>

        <Skeleton className="h-56 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const income = summary.income || 0;
  const expenses = summary.expenses || 0;
  const balance = summary.balance || 0;
  const transactionCount = summary.transactionCount || 0;
  const savingsRate =
    income > 0
      ? (
          (balance / income) *
          100
        ).toFixed(1)
      : "0.0";

  const monthlyData = (
    dashboardData?.monthlyData || []).map((item) => {
    const monthName =
      new Date(
        item.year,
        item.month - 1
      ).toLocaleString(
        "en-US",
        {
          month: "short",
        }
      );

    return {
      ...item,
      month:
        `${monthName} ${item.year}`,
    };
  });

  const categoryData = (
    dashboardData?.categorySpending || []
  ).map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  const highestCategory = dashboardData?.categorySpending?.[0];

  let insight = "Add more transactions to receive meaningful financial insights.";

  if (highestCategory && expenses > 0) {
    const percentage = (
      (highestCategory.amount /
        expenses) *
      100
    ).toFixed(1);

    insight =
      `Your largest spending category is ${
        highestCategory.category
      }, accounting for ${percentage}% of your total expenses. You have spent ${formatCurrency(
        highestCategory.amount
      )} in this category.`;
  }

  const selectedPeriodFooter =
    activeTimeRange === "all" ? "Across all transactions" : "For selected period";

  const summaryCards = [
    {
      title: "Total Income",
      value: formatCurrency(income),
      description: "Money received",
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      accent: "text-emerald-600 dark:text-emerald-400",
      footer: selectedPeriodFooter,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(expenses),
      description: "Money spent",
      icon: TrendingDown,
      iconClass:"bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
      accent:"text-rose-600 dark:text-rose-400",
      footer:"Across all expense categories",
    },
    {
      title: "Balance",
      value: formatCurrency(balance),
      description:"Income minus expenses",
      icon: WalletCards,
      iconClass:"bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]",
      accent:"text-[#4F6BFF] dark:text-[#8EA0FF]",
      footer: `${savingsRate}% savings rate`,
    },
    {
      title: "Transactions",
      value: transactionCount.toLocaleString("en-IN"),
      description:"Transactions recorded",
      icon: ReceiptText,
      iconClass:"bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      accent:"text-amber-600 dark:text-amber-400",
      footer:"Available for analysis",
    },
  ];

  const chartConfig = {
    income: {
      label: "Income",
      color: "#16C79A",
    },
    expenses: {
      label: "Expenses",
      color: "#F45B69",
    },
  };

  const categoryColors = [
    "#4F6BFF",
    "#16C79A",
    "#FFB547",
    "#F45B69",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
    "#14B8A6",
  ];

  return (
    <div className="space-y-6">
      {/*HEADER*/}
      <div className="space-y-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
            >
              Financial overview
            </Badge>

            <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
              Your financial snapshot
            </h1>

            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Understand your income, spending and financial behavior at a glance.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Select
                value={timeRange}
                onValueChange={handleTimeRangeChange}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#4F6BFF]/40 focus:ring-2 focus:ring-[#4F6BFF]/15 dark:border-slate-800 dark:bg-[#081321] dark:text-slate-200 sm:w-[200px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <CalendarRange className="size-4 shrink-0 text-[#4F6BFF]" />
                    <span className="truncate">
                      {TIME_RANGE_LABELS[timeRange] || "All time"}
                    </span>
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {activeTimeRange === "custom" && appliedDateRange?.from && appliedDateRange?.to && !customPanelOpen && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCustomFrom(appliedDateRange.from);
                      setCustomTo(appliedDateRange.to);
                      setTimeRange("custom");
                      setCustomPanelOpen(true);
                    }}
                    className="h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-[#4F6BFF]/40 dark:border-slate-800 dark:bg-[#081321] dark:text-slate-200 sm:w-auto"
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0 text-[#4F6BFF]" />

                    <span className="truncate">
                      {format(
                        appliedDateRange.from,
                        "dd MMM yyyy"
                      )}{" "}
                      –{" "}
                      {format(
                        appliedDateRange.to,
                        "dd MMM yyyy"
                      )}
                    </span>
                  </Button>
                )}

              <button
                onClick={() =>
                  navigate("/transactions")
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#4F6BFF]/40 hover:text-[#4F6BFF] dark:border-slate-800 dark:bg-[#081321] dark:text-slate-300 sm:w-auto"
              >
                View transactions
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {timeRange === "custom" && customPanelOpen && (
          <div className="flex justify-start lg:justify-end">
            <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#081321]">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#07111F] dark:text-white">
                  Custom date range
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose a start and end date.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    From
                  </label>

                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-11 w-full justify-between rounded-xl border-slate-200 bg-white px-3 text-left font-medium dark:border-slate-700 dark:bg-slate-900"
                        />
                      }
                    >
                      <span
                        className={
                          customFrom ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}
                      >
                        {customFrom
                          ? format(customFrom,"dd MMM yyyy")
                          : "Select start date"}
                      </span>

                      <CalendarIcon className="size-4 shrink-0 text-slate-400" />
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0" 
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={customFrom}
                        onSelect={(date) => {
                          setCustomFrom(date);

                          if (date && customTo && customTo < date) {
                            setCustomTo(undefined);
                          }
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={
                          new Date(new Date().getFullYear() + 5,11)
                        }
                        showOutsideDays={false}
                        classNames={{nav: "hidden"}}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    To
                  </label>

                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-11 w-full justify-between rounded-xl border-slate-200 bg-white px-3 text-left font-medium dark:border-slate-700 dark:bg-slate-900"
                        />
                      }
                    >
                      <span
                        className={
                          customTo
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-slate-400"
                        }
                      >
                        {customTo
                          ? format(
                              customTo,
                              "dd MMM yyyy"
                            )
                          : "Select end date"}
                      </span>

                      <CalendarIcon className="size-4 shrink-0 text-slate-400" />
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={customTo}
                        onSelect={setCustomTo}
                        disabled={(date) =>
                          customFrom
                            ? date < customFrom
                            : false
                        }
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={
                          new Date(new Date().getFullYear() + 5,11)
                        }
                        showOutsideDays={false}
                        classNames={{nav: "hidden"}}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCustomRange}
                  className="justify-center rounded-lg text-slate-500 sm:justify-start"
                >
                  Clear dates
                </Button>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelCustomRange}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={!customFrom || !customTo}
                    onClick={handleApplyCustomRange}
                    className="rounded-lg bg-[#4F6BFF] px-4 text-white hover:bg-[#4058E8]"
                  >
                    Apply range
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/*SUMMARY CARDS*/}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(
          ({
            title,
            value,
            description,
            icon: Icon,
            iconClass,
            accent,
            footer,
          }) => (
            <Card
              key={title}
              className="group rounded-3xl border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/40 dark:border-slate-800 dark:bg-[#081321] dark:hover:shadow-none"
            >
              <CardContent className="p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {title}
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-tight text-[#07111F] dark:text-white">
                      {value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                    />
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-400 dark:text-slate-500">
                  {description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p
                    className={`text-xs font-semibold ${accent}`}
                  >
                    {footer}
                  </p>
                </div>

              </CardContent>
            </Card>
          )
        )}
      </div>

      {/*MAIN CHART GRID*/}

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">

        {/* Income vs expenses */}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">

            <div>
              <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                Income vs Expenses
              </CardTitle>

              <CardDescription className="mt-1">
                Monthly financial activity
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 text-xs">

              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16C79A]" />
                Income
              </div>

              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F45B69]" />
                Expenses
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">

            {monthlyData.length ===
            0 ? (
              <div className="flex h-[330px] items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No transactions found for this period.
                  </p>

                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Try selecting another date range.
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="h-[330px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={monthlyData}
                  margin={{left: 4, right: 8, top: 16, bottom: 0,}}
                >
                  <defs>
                    <linearGradient
                      id="incomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#16C79A" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#16C79A" stopOpacity={0}/>

                    </linearGradient>

                    <linearGradient
                      id="expenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F45B69" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#F45B69"stopOpacity={0}/>

                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    className="stroke-slate-200/80 dark:stroke-slate-800"
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={24}
                    tick={{fontSize: 12}}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={58}
                    tick={{fontSize: 12,}}
                    tickFormatter={formatCompactCurrency}
                  />

                  <ChartTooltip
                    cursor={{stroke:"#94a3b8", strokeDasharray:"4 4"}}
                    content={
                      <ChartTooltipContent
                        formatter={(value,name) => (
                          <div className="flex w-full items-center justify-between gap-6">
                            <span className="capitalize text-muted-foreground">
                              {name}
                            </span>

                            <span className="font-mono font-semibold text-foreground">
                              {formatCurrency(value)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#16C79A"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                    dot={false}
                    activeDot={{r: 5, strokeWidth: 2}}
                  />

                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#F45B69"
                    strokeWidth={2.5}
                    fill="url(#expenseGradient)"
                    dot={false}
                    activeDot={{r: 5,strokeWidth: 2}}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category chart */}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
              Spending by Category
            </CardTitle>

            <CardDescription>
              Where your money is going
            </CardDescription>
          </CardHeader>

          <CardContent>

            {categoryData.length === 0 ? (
              <div className="flex h-[330px] items-center justify-center">
               <div className="text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No expenses found for this period.
                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Try selecting another date range.
                </p>
              </div>
              </div>
            ) : (
              <div>

                <ChartContainer
                  config={{}}
                  className="mx-auto h-[230px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value,name) => (
                            <div className="flex w-full items-center justify-between gap-5">
                              <span className="text-muted-foreground">
                                {name}
                              </span>

                              <span className="font-mono font-semibold text-foreground">
                                {formatCurrency(
                                  value
                                )}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />

                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {categoryData.map(
                        (entry,index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              categoryColors[index % categoryColors.length]
                            }
                          />
                        )
                      )}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="mt-4 space-y-3">

                  {categoryData
                    .slice(0, 5)
                    .map(
                      (category,index) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">

                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  categoryColors[index %categoryColors.length],
                              }}
                            />
                            <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                              {
                                category.name
                              }
                            </span>
                          </div>

                          <span className="shrink-0 text-sm font-semibold text-[#07111F] dark:text-white">
                            {formatCurrency(category.value)}
                          </span>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/*AI INSIGHT*/}

      <Card className="relative overflow-hidden rounded-3xl border-0 bg-[#07111F] text-white shadow-xl shadow-slate-900/10 dark:bg-[#0A1727]">

        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#4F6BFF]/25 blur-3xl" />

          <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#16C79A]/15 blur-3xl" />

            <CardContent className="relative p-6 sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="max-w-3xl">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFB547] text-[#422900]">
                      <Sparkles
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                        FinSight insight
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        Financial Insight
                      </h3>
                    </div>
                  </div>

                  <p className="mt-6 text-base leading-7 text-white/75 sm:text-lg">
                    {insight}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
                    <Bot size={14} />
                    Generated from your transaction data
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate("/chatbot")
                  }
                  className="group flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#07111F] transition hover:-translate-y-0.5"
                >
                  Ask FinSight

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
  );
}