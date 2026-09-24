import { API_URL } from "@/lib/utils";
import {
  useEffect,
  useState,
} from "react";
import { authFetch } from "@/utils/authFetch";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeAlert,
  CalendarIcon,
  CalendarRange,
  CircleDollarSign,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Skeleton,
} from "@/components/ui/skeleton";

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
import { getDateRange } from "@/utils/dateRange";

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

const loadSavedAnomalyCustomRange = () => {
  try {
    const saved = localStorage.getItem(
      "anomalyCustomRange"
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

    return {
      from,
      to,
    };
  } catch {
    return {
      from: undefined,
      to: undefined,
    };
  }
};

export default function Anomaly() {
  const savedCustomRange =
    loadSavedAnomalyCustomRange();

  const getInitialTimeRange = () => {
    const savedRange =localStorage.getItem("anomalyTimeRange");

    if (!savedRange ||!TIME_RANGE_LABELS[savedRange]) {
      return "all";
    }

    if (
      savedRange === "custom" &&
      (!savedCustomRange?.from ||
        !savedCustomRange?.to)
    ) {
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

  const [anomalies, setAnomalies] =useState([]);

  const [loading, setLoading] =useState(true);

  const [error, setError] =useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    localStorage.setItem("anomalyTimeRange",activeTimeRange);
  }, [activeTimeRange]);

  useEffect(() => {
    if (
      appliedCustomRange?.from &&
      appliedCustomRange?.to
    ) {
      localStorage.setItem(
        "anomalyCustomRange",
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
      to: customTo
    };

    setAppliedCustomRange(nextRange);
    setActiveTimeRange("custom");
    setTimeRange("custom");
    setCustomPanelOpen(false);
  };

  useEffect(() => {
    const fetchAnomalies =async () => {
        try {
          setLoading(true);
          setError("");

          const range = getDateRange(activeTimeRange,appliedCustomRange);

          const params =new URLSearchParams();

          if (range) {
            params.set("startDate",range.startDate);
            params.set("endDate",range.endDate);
          }

          const url =params.toString()
              ? `${API_URL}/api/transactions/anomalies?${params.toString()}`
              : `${API_URL}/api/transactions/anomalies`;

          const response =await authFetch(url);        
          if (!response) return;

          const data =await response.json();

          if (!response.ok) {
            throw new Error(data.message ||"Failed to load anomalies");
          }

          const anomalyTransactions = (data.anomalies || []).sort((a, b) =>
              Number(b.anomalyScore || 0) - Number(a.anomalyScore || 0)
            );

          setAnomalies(anomalyTransactions);
        } catch (error) {
          console.error("Anomaly fetch error:",error.message);

          setError(error.message ||"Failed to load unusual transactions");
        } finally {
          setLoading(false);
        }
      };

    fetchAnomalies();
  }, [token,activeTimeRange,appliedCustomRange]);

  const formatCurrency = (value = 0) =>
    `₹${Number(
      value
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getRiskLevel = (score = 0) => {
    if (score >= 0.75) {
      return {
        label: "High",
        badgeClass:"border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
        iconClass:"bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
        progressClass:"bg-red-500",
      };
    }

    if (score >= 0.5) {
      return {
        label: "Medium",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
        iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
        progressClass: "bg-amber-500",
      };
    }

    return {
      label: "Low",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400",
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      progressClass: "bg-blue-500",
    };
  };

  const totalAnomalySpending =
    anomalies.reduce(
      (sum,transaction) =>sum +Number(transaction.amount || 0),0);

  const highestScore =
    anomalies.length > 0? Number(anomalies[0].anomalyScore || 0): 0;

  if (loading && anomalies.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <Skeleton className="h-[420px] rounded-3xl" />
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

      {/*HEADER*/}

      <div className="space-y-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
            >
              Spending signals
            </Badge>

            <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
              Anomaly Detection
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Review transactions that differ from your normal spending patterns.
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

                    <span className="truncate">{TIME_RANGE_LABELS[timeRange] || "All time"}
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
                          mode="single"
                          selected={customFrom}
                          onSelect={(date) => {setCustomFrom(date);

                            if (date &&customTo && customTo <date) {
                              setCustomTo(undefined);
                            }
                          }}
                          captionLayout="dropdown"
                          startMonth={new Date(2000,0)}
                          endMonth={
                            new Date(new Date().getFullYear() +5,11)}
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
                          disabled={(date) =>customFrom? date <customFrom: false}
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
                    onClick={handleClearCustomDates}
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
                      disabled={!customFrom ||!customTo}
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

      {/*SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Anomalies Detected
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-[#07111F] dark:text-white">
                  {
                    anomalies.length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                <ShieldAlert
                  size={20}
                />
              </div>
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              Transactions flagged as unusual
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Highest Score
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-[#07111F] dark:text-white">
                  {highestScore.toFixed(
                    2
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <BadgeAlert
                  size={20}
                />
              </div>
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              Strongest anomaly
              signal
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Anomaly Spending
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-[#07111F] dark:text-white">
                  {formatCurrency(totalAnomalySpending)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <CircleDollarSign size={20}/>
              </div>
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              Total value of unusual transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/*ANOMALY LIST */}

      <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

        <CardHeader className="border-b border-slate-100 dark:border-slate-800">

          <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
            Unusual Transactions
          </CardTitle>

          <CardDescription>
            Transactions that differ from your usual spending behavior.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">

          {anomalies.length ===
          0 ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldAlert
                  size={24}
                />
              </div>

              <h3 className="mt-5 font-bold text-[#07111F] dark:text-white">
                No unusual transactions detected
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Your transactions currently appear consistent with your spending patterns.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">

              {anomalies.map((transaction) => {
                  const risk =getRiskLevel(transaction.anomalyScore);

                  const score =Number(transaction.anomalyScore ||0);

                  const percentage =Math.min(score * 100,100);

                  return (
                    <div
                      key={transaction._id}
                      className="p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30 sm:p-6"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}
                        <div className="flex min-w-0 gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${risk.iconClass}`}
                          >
                            <AlertTriangle size={20}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">

                              <p className="truncate font-bold text-[#07111F] dark:text-white">
                                {transaction.description}
                              </p>

                              <Badge
                                variant="outline"
                                className={`rounded-full ${risk.badgeClass}`}
                              >
                                {
                                  risk.label
                                }{" "}
                                anomaly
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">

                              <span>
                                {transaction.category ||"Other"}
                              </span>

                              <span>
                                {formatDate(transaction.date)}
                              </span>

                              <span>
                                Source:{" "}{transaction.source ||"Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT */}
                       <div className="flex items-end justify-between gap-6 lg:block lg:text-right">

                          <div>
                            <p className="text-lg font-black text-[#07111F] dark:text-white">
                              {formatCurrency(transaction.amount)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                              Score{" "}
                              {score.toFixed(3)}
                            </p>
                          </div>

                          <ArrowUpRight
                            size={18}
                            className="text-slate-300 lg:hidden dark:text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Progress */}

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span>
                            Anomaly strength
                          </span>

                          <span className="font-semibold">
                            {Math.round(percentage)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${risk.progressClass}`}
                            style={{width: `${percentage}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXPLANATION */}

      <Card className="rounded-3xl border-slate-200/80 bg-slate-50/70 shadow-none dark:border-slate-800 dark:bg-slate-900/40">

        <CardContent className="p-5 sm:p-6">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
              <Sparkles
                size={18}
              />
            </div>

            <div>
              <p className="font-semibold text-[#07111F] dark:text-white">
                How to read these signals
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Anomalies indicate unusual spending patterns detected by the model.They do not necessarily indicate fraud.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}