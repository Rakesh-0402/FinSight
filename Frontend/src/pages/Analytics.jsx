import { API_URL } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { getDateRange } from "@/utils/dateRange";
import { authFetch } from "@/utils/authFetch";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CalendarIcon,
  CircleDollarSign,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

const loadSavedAnalyticsCustomRange = () => {
  try {
    const saved = localStorage.getItem(
      "analyticsCustomRange"
    );

    if (!saved) {
      return {
        from: undefined,
        to: undefined,
      };
    }

    const parsed = JSON.parse(saved);
    const from = parsed?.from
      ? new Date(parsed.from)
      : undefined;

    const to = parsed?.to
      ? new Date(parsed.to)
      : undefined;

    if (
      (from && Number.isNaN(from.getTime())) ||
      (to && Number.isNaN(to.getTime()))
    ) {
      return {
        from: undefined,
        to: undefined,
      };
    }

    return {from,to};
  } catch {
    return {
      from: undefined,
      to: undefined,
    };
  }
};

export default function Analytics() {
  const savedCustomRange = loadSavedAnalyticsCustomRange();

  const getInitialTimeRange = () => {
    const savedRange = localStorage.getItem("analyticsTimeRange");

    if (!savedRange ||!TIME_RANGE_LABELS[savedRange]) {
      return "all";
    }

    if (savedRange === "custom" && (!savedCustomRange?.from ||!savedCustomRange?.to)) {
      return "all";
    }
    return savedRange;
  };

  const initialTimeRange = getInitialTimeRange();
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [activeTimeRange,setActiveTimeRange] = useState(initialTimeRange);
  const [customFrom, setCustomFrom] = useState(savedCustomRange.from);
  const [customTo, setCustomTo] = useState(savedCustomRange.to);

  const [appliedCustomRange,setAppliedCustomRange] = useState(savedCustomRange);

  const [customPanelOpen,setCustomPanelOpen] = useState(false);

  const [analyticsData,setAnalyticsData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    localStorage.setItem("analyticsTimeRange",activeTimeRange);
  }, [activeTimeRange]);

  useEffect(() => {
    if (appliedCustomRange?.from && appliedCustomRange?.to) {
      localStorage.setItem(
        "analyticsCustomRange",
        JSON.stringify({
          from:
            appliedCustomRange.from.toISOString(),
          to:
            appliedCustomRange.to.toISOString(),
        })
      );
    }
  }, [appliedCustomRange]);

  const handleTimeRangeChange = (value) => {
    if (value === "custom") {
      setTimeRange("custom");

      setCustomFrom(appliedCustomRange?.from);

      setCustomTo(appliedCustomRange?.to);

      setCustomPanelOpen(true);
      return;
    }

    setTimeRange(value);
    setActiveTimeRange(value);
    setCustomPanelOpen(false);
  };

  const handleCancelCustomRange = () => {
    setCustomFrom(appliedCustomRange?.from);

    setCustomTo(appliedCustomRange?.to);

    setTimeRange(activeTimeRange);

    setCustomPanelOpen(false);
  };

  const handleClearCustomDates = () => {
    setCustomFrom(undefined);
    setCustomTo(undefined);
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

    setAppliedCustomRange(nextRange);
    setActiveTimeRange("custom");
    setTimeRange("custom");
    setCustomPanelOpen(false);
  };

  useEffect(() => {
    const fetchAnalytics =
      async () => {
        try {
          setLoading(true);
          setError("");

          const range = getDateRange(
            activeTimeRange,
            appliedCustomRange
          );

          const params = new URLSearchParams();

          if (range) {
            params.set("startDate", range.startDate);
            params.set("endDate", range.endDate);
          }

          const url = params.toString()
            ? `${API_URL}/api/analytics?${params.toString()}`
            : `${API_URL}/api/analytics`;

          const response = await authFetch(url);
          if (!response) return;
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to load analytics");
          }

          setAnalyticsData(data);

        } catch (error) {
            setError(error.message ||"Failed to load analytics data");
            
        } finally {
          setLoading(false);
        }
      };

    fetchAnalytics();
  }, [token,activeTimeRange,appliedCustomRange]);

  const formatCurrency = (value = 0) =>
    `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatCompactCurrency = (value = 0) => {
    const number =Number(value);

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

  const analytics = useMemo(() => {
    if (!analyticsData) {
      return {
        averageExpense: 0,
        highestExpense: null,
        incomeExpenseRatio: 0,
        categoryData: [],
        monthlyData: [],
        biggestTransactions: [],
        topCategory: null,
        highestSpendingMonth: null,
        monthlyTrend: 0,
      };
    }

    const averageExpense = analyticsData?.expenseStats?.averageExpense || 0;

    const highestExpense =analyticsData?.highestExpenseTransaction ||null;

    const incomeExpenseRatio =analyticsData?.summary?.incomeExpenseRatio || 0;

    const categoryData = analyticsData?.categoryData || [];

    const biggestTransactions = analyticsData?.biggestExpenses || [];

    const monthlyData = (analyticsData?.monthlyData || []).map((item) => {
      const monthName =
        new Date(item.year,item.month - 1).toLocaleString(
          "en-US",
          {
            month: "short",
          }
        );

      return {
        ...item,

        label:`${monthName} ${item.year}`,

        savings:(item.income || 0) -(item.expenses || 0),
      };
    });

    const topCategory = categoryData.length > 0? categoryData[0]: null;

    const highestSpendingMonth =
      monthlyData.length > 0 ? [...monthlyData].sort(
            (a, b) =>
              Number(b.expenses || 0) -
              Number(a.expenses || 0))[0]: null;

    let monthlyTrend = 0;

    if (monthlyData.length >= 2) {
      const previous = monthlyData[monthlyData.length - 2]?.expenses || 0;

      const current =monthlyData[monthlyData.length - 1]?.expenses || 0;

      if (previous > 0) {
        monthlyTrend =((current - previous) /previous) *100;
      }
    }

    return {
      averageExpense,
      highestExpense,
      incomeExpenseRatio,
      categoryData,
      monthlyData,
      biggestTransactions,
      topCategory,
      highestSpendingMonth,
      monthlyTrend,
    };
  }, [analyticsData]);

  if (loading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />

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

        <Skeleton className="h-[430px] rounded-3xl" />
        <Skeleton className="h-[380px] rounded-3xl" />

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
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

  const categoryChartData = analytics.categoryData.map(
      (item) => ({
        category:
          item.category,
          amount: item.amount,
      })
    );

  const analyticsCards = [
    {
      title:"Average Expense",
      value:formatCurrency(analytics.averageExpense),
      description:"Average expense value",
      icon:CircleDollarSign,

      iconClass:"bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]",

      footer:"Across expense transactions",
    },

    {
      title:"Highest Expense",

      value:
        analytics.highestExpense? formatCurrency(analytics.highestExpense.amount): "₹0",

      description: analytics.highestExpense?.description ||"No data",

      icon:ReceiptText,

      iconClass:"bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",

      footer:"Largest recorded expense",
    },

    {
      title:"Income / Expense",

      value: Number(analytics.incomeExpenseRatio).toFixed(2),

      description:"Income-to-expense ratio",

      icon:WalletCards,

      iconClass:"bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",

      footer:"Higher means more income relative to spending",
    },

    {
      title:"Monthly Change",

      value: `${analytics.monthlyTrend >0 ? "+" : ""
      }${analytics.monthlyTrend.toFixed(
        1
      )}%`,

      description:"Expense change vs previous month",

      icon:analytics.monthlyTrend >0 ? TrendingUp : TrendingDown,

      iconClass: analytics.monthlyTrend >  0
          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",

      footer:
        analytics.monthlyTrend >
        0
          ? "Spending increased"
          : analytics.monthlyTrend <
            0
          ? "Spending decreased"
          : "Spending remained stable",
    },
  ];

  const categoryChartConfig = {
    amount: {
      label: "Amount",
      color: "#4F6BFF",
    },
  };

  const trendChartConfig = {
    expenses: {
      label: "Expenses",
      color: "#F45B69",
    },
  };

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
              Spending intelligence
            </Badge>

            <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
              Financial Analytics
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Explore deeper patterns across your spending,
              categories and monthly activity.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Select
                value={timeRange}
                onValueChange={handleTimeRangeChange}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#4F6BFF]/40 dark:border-slate-800 dark:bg-[#081321] dark:text-slate-200 sm:w-[200px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <CalendarRange className="size-4 shrink-0 text-[#4F6BFF]" />

                    <span className="truncate">
                      {TIME_RANGE_LABELS[
                        timeRange
                      ] || "All time"}
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

              {activeTimeRange ==="custom" &&
                appliedCustomRange?.from &&
                appliedCustomRange?.to &&
                !customPanelOpen && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCustomFrom(appliedCustomRange.from);
                      setCustomTo(appliedCustomRange.to);
                      setTimeRange("custom");
                      setCustomPanelOpen(true);
                    }}
                    className="h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-[#4F6BFF]/40 dark:border-slate-800 dark:bg-[#081321] dark:text-slate-200 sm:w-auto"
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0 text-[#4F6BFF]" />

                    <span className="truncate">
                      {format(
                        appliedCustomRange.from,
                        "dd MMM yyyy"
                      )}{" "}
                      –{" "}
                      {format(
                        appliedCustomRange.to,
                        "dd MMM yyyy"
                      )}
                    </span>
                  </Button>
                )}
            </div>
          </div>
        </div>

        {timeRange === "custom" &&
          customPanelOpen && (
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
                            customFrom
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-400"
                          }
                        >
                          {customFrom
                            ? format(
                                customFrom,
                                "dd MMM yyyy"
                              )
                            : "Select start date"}
                        </span>

                        <CalendarIcon className="size-4 shrink-0 text-slate-400" />
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single" selected={customFrom}
                          onSelect={(date) => {
                            setCustomFrom(date);

                            if (date &&customTo &&customTo <date) {
                              setCustomTo(undefined);
                            }
                          }}
                          captionLayout="dropdown"
                          startMonth={new Date(2000,0)}
                          endMonth={new Date(new Date().getFullYear() +5,11)}
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
                          {customTo? format(customTo,"dd MMM yyyy"): "Select end date"}
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
                            customFrom? date <customFrom : false
                          }
                          captionLayout="dropdown"
                          startMonth={new Date(2000,0)}
                          endMonth={new Date(new Date().getFullYear() +5,11)}
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
                    onClick={
                      handleClearCustomDates
                    }
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
                      disabled={
                        !customFrom ||
                        !customTo
                      }
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

      {/*ANALYTICS CARDS*/}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {analyticsCards.map(
          ({
            title,
            value,
            description,
            icon: Icon,
            iconClass,
            footer,
          }) => (
            <Card
              key={title}
              className="rounded-3xl border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/40 dark:border-slate-800 dark:bg-[#081321] dark:hover:shadow-none"
            >
              <CardContent className="p-5">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

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
                    <Icon size={20}/>
                  </div>
                </div>

                <p className="mt-4 truncate text-sm text-slate-400 dark:text-slate-500">
                  {description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {footer}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/*CATEGORY BAR CHART*/}

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

        <CardHeader>

          <div className="flex items-start justify-between gap-4">

            <div>
              <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                Spending by Category
              </CardTitle>

              <CardDescription className="mt-1">
                Compare your highest spending categories.
              </CardDescription>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
              <BarChart3 size={19}/>
            </div>
          </div>
        </CardHeader>

        <CardContent>

          {categoryChartData.length ===
          0 ? (
            <div className="flex h-[360px] items-center justify-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No category data available.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={categoryChartConfig}
              className="h-[360px] w-full sm:h-[400px]"
            >
              <BarChart
                accessibilityLayer
                data={categoryChartData}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                  top: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="4 4"
                  className="stroke-slate-200/80 dark:stroke-slate-800"
                />

                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{fontSize:12}}
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={95}
                  tick={{fontSize: 12}}
                />

                <ChartTooltip
                  cursor={{fill:"rgba(79,107,255,0.05)"}}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-6">
                          <span className="text-muted-foreground">
                            Amount
                          </span>

                          <span className="font-mono font-semibold text-foreground">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />

                <Bar
                  dataKey="amount"
                  fill="#4F6BFF"
                  radius={[0,8,8,0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/*SPENDING TREND */}

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">

            <div>
              <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                Spending Trend
              </CardTitle>

              <CardDescription className="mt-1">
                See how your expenses change over time.
              </CardDescription>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <TrendingUp size={19}/>
            </div>
          </div>
        </CardHeader>

        <CardContent>
         {analytics.monthlyData
            .length === 0 ? (
            <div className="flex h-[330px] items-center justify-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No monthly data available.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={trendChartConfig}
              className="h-[330px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={analytics.monthlyData}
                margin={{left: 4, right: 8, top: 16}}
              >

               <defs>
                  <linearGradient
                    id="analyticsExpenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                  <stop
                    offset="5%"
                    stopColor="#F45B69"
                    stopOpacity={
                    0.25
                  }
                  />

                  <stop
                    offset="95%"
                    stopColor="#F45B69"
                    stopOpacity={
                    0
                  }
                  />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  className="stroke-slate-200/80 dark:stroke-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={24}
                  tick={{fontSize:12}}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={58}
                  tick={{fontSize:12}}
                  tickFormatter={formatCompactCurrency}
                />

                <ChartTooltip
                  cursor={{
                    stroke:
                      "#94a3b8",
                    strokeDasharray:
                      "4 4",
                  }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-6">
                          <span className="text-muted-foreground">
                            Expenses
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
                  dataKey="expenses"
                  stroke="#F45B69"
                  strokeWidth={2.5}
                  fill="url(#analyticsExpenseGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth:2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/*CATEGORY + BIGGEST*/}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Category Breakdown */}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
              Category Breakdown
            </CardTitle>

            <CardDescription>
              Your highest spending categories and transaction counts.
            </CardDescription>
          </CardHeader>

          <CardContent>

            {analytics.categoryData
              .length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                No category data available.
              </p>
            ) : (
              <div className="space-y-2">

                {analytics.categoryData
                  .slice(0, 8)
                  .map((item,index) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-xs font-bold text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                            {index +1}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-[#07111F] dark:text-white">
                              {item.category}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                              {item.count}{" "}
                              transactions
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#07111F] dark:text-white">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    )
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biggest Expenses */}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
              Biggest Expenses
            </CardTitle>

            <CardDescription>
              Your largest recorded expense transactions.
            </CardDescription>
          </CardHeader>

          <CardContent>

            {analytics
              .biggestTransactions
              .length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                No expense data available.
              </p>
            ) : (
              <div className="space-y-2">

                {analytics.biggestTransactions.map(
                  (transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                          <ArrowUpRight size={16}/>
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-[#07111F] dark:text-white">
                            {transaction.description}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                            {transaction.category}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-400">
                        -
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/*KEY FINDINGS */}

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

        <CardHeader>
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB547]/20 text-amber-600 dark:text-amber-400">
              <Sparkles size={19}/>
            </div>

            <div>
              <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                Key Findings
              </CardTitle>

              <CardDescription>
                Quick takeaways from your current analytics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>

          <div className="grid gap-4 md:grid-cols-3">

            {/* Top category */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                <BarChart3 size={18}/>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Top category
              </p>

              <p className="mt-2 text-lg font-bold text-[#07111F] dark:text-white">
                {analytics.topCategory?.category ||"N/A"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {analytics.topCategory? formatCurrency(analytics.topCategory.amount): ""}
              </p>
            </div>

            {/* Highest month */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <CalendarDays size={18}/>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Highest spending month
              </p>

              <p className="mt-2 text-lg font-bold text-[#07111F] dark:text-white">
                {analytics
                  .highestSpendingMonth
                  ?.label ||
                  "N/A"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {analytics
                  .highestSpendingMonth
                  ? formatCurrency(
                      analytics
                        .highestSpendingMonth
                        .expenses
                    )
                  : ""}
              </p>
            </div>

            {/* Direction */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  analytics.monthlyTrend >
                  0
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {analytics.monthlyTrend >
                0 ? (
                  <ArrowUpRight size={18}/>
                ) : (
                  <ArrowDownRight size={18} />
                )}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Spending direction
              </p>

              <p className="mt-2 text-lg font-bold text-[#07111F] dark:text-white">
                {analytics.monthlyTrend >
                0
                  ? "Increasing"
                  : analytics.monthlyTrend <
                    0
                  ? "Decreasing"
                  : "Stable"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {Math.abs(analytics.monthlyTrend).toFixed(1)} % vs previous month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}