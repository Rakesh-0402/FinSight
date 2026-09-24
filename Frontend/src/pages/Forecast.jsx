import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  CalendarDays,
  Upload,
  RotateCcw,
  ChartNoAxesCombined,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {Badge} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {Skeleton} from "@/components/ui/skeleton";
import {Button} from "@/components/ui/button";
import {useNavigate} from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function Forecast() {
  const navigate = useNavigate();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingMonth, setPendingMonth] = useState(null);
  const [monthToConfirm, setMonthToConfirm] = useState(null);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await authFetch(`${API_URL}/api/forecast`);
      if (!response) return;
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load forecast");
      }
      setForecastData(data);
    } catch (error) {
      console.error("Forecast fetch error:", error);
      setError(error.message || "Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const formatMonth = ({ year, month }) =>
    new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const monthKey = ({ year, month }) => `${year}-${month}`;

  const updateZeroMonth = async (item, remove = false) => {
    const key = monthKey(item);
    try {
      setPendingMonth(key);
      setActionError("");
      const url = remove
        ? `${API_URL}/api/forecast/zero-months/${item.year}/${item.month}`
        : `${API_URL}/api/forecast/zero-months`;
      const response = await authFetch(url, {
        method: remove ? "DELETE" : "POST",
        ...(!remove && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: item.year, month: item.month }),
        }),
      });
      if (!response) return;
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update month confirmation");
      }
      setMonthToConfirm(null);
      await fetchForecast();
    } catch (error) {
      setActionError(error.message || "Could not update month confirmation");
    } finally {
      setPendingMonth(null);
    }
  };

  const missingMonths = forecastData?.missingMonths || [];
  const confirmedMonths = (forecastData?.historicalData || []).filter(
    (item) => item.status === "confirmed_zero"
  );

  const formatCurrency = (value = 0) =>
    `₹${Number(value).toLocaleString("en-IN", 
    {
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

  const latestForecast =
    forecastData?.forecast?.[0] ||null;

  const chartData = useMemo(() => {
      if (!forecastData) {
        return [];
      }

      const historical = (forecastData.historicalData ||[]).map((item) => {
        const monthName =
          new Date(
            item.year,
            item.month - 1
          ).toLocaleString(
            "en-US",
            {
              month:"short",
            }
          );

        return {
          label:`${monthName} ${item.year}`,
          actual:item.expenses,
          predicted:null,
        };
      });

      const nextForecast = latestForecast
          ? [
              {
                label:
                  `${new Date(
                    latestForecast.year,
                    latestForecast.month -1
                  ).toLocaleString(
                    "en-US",
                    {
                      month:"short",
                    }
                  )} ${
                    latestForecast.year
                  }`,
                actual:null,

                predicted:latestForecast.predictedExpenses,
              },
            ]
          : [];

      return [...historical, ...nextForecast];
    }, [forecastData,latestForecast]);

  const lastHistorical = forecastData?.historicalData?.[forecastData.historicalData.length - 1];

  const previousMonthExpenses =
    Number(lastHistorical?.expenses || 0);

  const predictedExpenses =
    Number(latestForecast?.predictedExpenses || 0);

  const forecastChange =
    previousMonthExpenses > 0
      ? ((predictedExpenses -previousMonthExpenses) /previousMonthExpenses) *100: 0;

  const nextMonthLabel =
    latestForecast
      ? new Date(latestForecast.year,latestForecast.month -1
        ).toLocaleString(
          "en-US",
          {
            month:"long",
            year:"numeric",
          }
        )
      : "Next month";

  const chartConfig = {
    actual: {
      label:"Actual Expenses",
      color: "#4F6BFF",
    },

    predicted: {
      label:"Forecast",
      color: "#FFB547",
    },
  };
  const lowerBound = Number(latestForecast?.lowerBound || 0);

  const upperBound = Number(latestForecast?.upperBound || 0 );

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <Skeleton className="h-8 w-52" />

          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({
            length: 3,
          }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-40 rounded-3xl"
              />
            )
          )}
        </div>

       <Skeleton className="h-[430px] rounded-3xl" />
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

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <Badge
          variant="secondary"
          className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
        >
          Spending forecast
        </Badge>

        <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
          Expense Forecast
        </h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Estimate your next month’s expenses using your historical spending pattern.
        </p>
      </div>

      {/* KNOWN ZERO MONTHS — available even after a forecast succeeds */}
      {confirmedMonths.length > 0 && (
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <CardHeader>
            <CardTitle className="text-base">Confirmed zero-expense months</CardTitle>
            <CardDescription>
              These months count as ₹0 in the forecast. Remove a confirmation if it was incorrect.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {confirmedMonths.map((item) => (
              <div key={monthKey(item)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatMonth(item)} · ₹0
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={Boolean(pendingMonth)}
                  onClick={() => updateZeroMonth(item, true)}
                  className="text-[#4F6BFF]"
                >
                  <RotateCcw size={14} /> Undo
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </p>
      )}

      {/* INSUFFICIENT DATA */}

      {!forecastData?.success ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-none dark:border-amber-900 dark:bg-amber-950/30">

          <CardContent className="p-6">

            <div className="flex gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <CalendarDays size={20}/>
              </div>

              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">
                  More history needed
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-400">
                  {forecastData?.message ||
                    "At least 6 months of historical expense data is required to generate a forecast."}
                </p>
              </div>
            </div>

            {missingMonths.length > 0 && (
              <div className="mt-6 border-t border-amber-200 pt-5 dark:border-amber-900">
                <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Months with unknown expense history
                </p>
                <p className="mb-4 text-xs leading-5 text-amber-800 dark:text-amber-300">
                  No recorded expense does not automatically mean ₹0. Upload your missing transactions, or confirm a month only if you had no expenses.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {missingMonths.map((item) => (
                    <div key={monthKey(item)} className="rounded-2xl border border-amber-200 bg-white/80 p-4 dark:border-amber-900 dark:bg-[#081321]">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#07111F] dark:text-white">{formatMonth(item)}</span>
                        <Badge variant="outline" className="text-amber-700 dark:text-amber-400">Unknown</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => navigate("/upload")}>
                          <Upload size={15} /> Upload transactions
                        </Button>
                        <Button type="button" size="sm" disabled={Boolean(pendingMonth)} onClick={() => setMonthToConfirm(item)} className="bg-[#4F6BFF] text-white hover:bg-[#4058E8]">
                          Confirm ₹0 expenses
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* SUMMARY CARDS */}

          <div className="grid gap-4 sm:grid-cols-3">

            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

              <CardContent className="p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Historical Months
                    </p>

                    <p className="mt-2 text-2xl font-black text-[#07111F] dark:text-white">
                      {forecastData?.historicalMonths ||
                        0}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                    <CalendarDays size={20}/>
                  </div>
                </div>

                <p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Used to train the forecast
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
              <CardContent className="p-5">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Next Month Forecast
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-tight text-[#07111F] dark:text-white">
                      {latestForecast
                        ? formatCurrency(
                            latestForecast.predictedExpenses
                          )
                        : "₹0"}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <CircleDollarSign size={20} />
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Predicted for {nextMonthLabel}
                  </p>

                  {latestForecast?.lowerBound != null &&
                    latestForecast?.upperBound != null && (
                      <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/20">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/70 dark:text-amber-400/70">
                          Estimated range
                        </p>

                        <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-400">
                          {formatCurrency(
                            latestForecast.lowerBound
                          )}
                          {" – "}
                          {formatCurrency(
                            latestForecast.upperBound
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-700/80 dark:text-amber-400/80">
                          Approximate variation based on historical expenses; not a guaranteed outcome.
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Expected Change
                    </p>

                    <p
                      className={`mt-2 text-2xl font-black ${
                        forecastChange >
                        0
                          ? "text-rose-600 dark:text-rose-400"
                          : forecastChange <
                            0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#07111F] dark:text-white"
                      }`}
                    >
                      {forecastChange >
                      0
                        ? "+"
                        : ""}
                      {forecastChange.toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      forecastChange >
                      0
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    }`}
                  >
                    <TrendingUp size={20}/>
                  </div>
                </div>

                <p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Compared with the latest historical month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FORECAST CHART */}

          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

            <CardHeader>

              <div className="flex items-start justify-between gap-4">

                <div>
                  <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                    Historical vs Forecast Expenses
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Your actual monthly expenses and the next predicted month.
                  </CardDescription>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                  <ChartNoAxesCombined size={19}/>
                </div>
              </div>
            </CardHeader>

            <CardContent>

              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4F6BFF]" />

                  Actual expenses
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFB547]" />

                  Next-month forecast
                </div>
              </div>

              <ChartContainer
                config={chartConfig}
                className="h-[380px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 4,
                    right: 10,
                    top: 16,
                  }}
                >

                  <defs>
                    <linearGradient
                      id="forecastActualGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#4F6BFF"
                        stopOpacity={0.2}
                      />

                      <stop
                        offset="95%"
                        stopColor="#4F6BFF"
                        stopOpacity={0}
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
                    width={60}
                    tick={{fontSize :12}}
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
                        formatter={(value,name) => {
                          if (value ==null) {
                            return null;
                          }

                          return (
                            <div className="flex w-full items-center justify-between gap-6">

                              <span className="text-muted-foreground">
                                {name ===
                                "actual"
                                  ? "Actual expenses"
                                  : "Forecast"}
                              </span>

                              <span className="font-mono font-semibold text-foreground">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#4F6BFF"
                    strokeWidth={2.5}
                    fill="url(#forecastActualGradient)"
                    dot={{r: 3}}
                    activeDot={{r: 5}}
                    connectNulls={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#FFB547"
                    strokeWidth={2.5}
                    strokeDasharray="6 6"
                    fill="transparent"
                    dot={{r: 5}}
                    activeDot={{r: 6}}
                    connectNulls={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* NOTE */}

          <Card className="rounded-3xl border-slate-200/80 bg-slate-50/70 shadow-none dark:border-slate-800 dark:bg-slate-900/40">

            <CardContent className="p-5 sm:p-6">

              <div className="flex gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                  <Sparkles size={18}/>
                </div>

                <div>
                  <p className="font-semibold text-[#07111F] dark:text-white">
                    Forecasts are estimates
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The prediction is based on your historical monthly expenses and will change as new transaction data is added.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog
        open={Boolean(monthToConfirm)}
        onOpenChange={(open) => { if (!open && !pendingMonth) setMonthToConfirm(null); }}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm no expenses in {monthToConfirm ? formatMonth(monthToConfirm) : "this month"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Only confirm if you had no expenses in this month. If you have missing transactions, upload them instead. You can undo this later.
              {monthToConfirm &&
                monthToConfirm.year === new Date().getUTCFullYear() &&
                monthToConfirm.month === new Date().getUTCMonth() + 1 && (
                  <span className="mt-2 block">The current month is still in progress: this confirms ₹0 expenses so far.</span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pendingMonth)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(pendingMonth)}
              onClick={(event) => {
                event.preventDefault();
                if (monthToConfirm) updateZeroMonth(monthToConfirm);
              }}
              className="bg-[#4F6BFF] text-white hover:bg-[#4058E8]"
            >
              {pendingMonth ? "Saving..." : "Confirm ₹0 expenses"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}