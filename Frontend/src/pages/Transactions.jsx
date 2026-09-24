import { API_URL } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";
import {
  Search,
  SlidersHorizontal,
  X,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  CalendarRange,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import {useEffect,useState} from "react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";

import {Skeleton} from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {getDateRange} from "@/utils/dateRange";

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

const loadSavedTransactionsCustomRange = () => {
  try {
    const saved = localStorage.getItem("transactionsCustomRange");

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

const Transactions = () => {
  const savedCustomRange = loadSavedTransactionsCustomRange();

  const getInitialTimeRange = () => {
    const savedRange = localStorage.getItem("transactionsTimeRange");

    if (!savedRange || !TIME_RANGE_LABELS[savedRange]) {
      return "all";
    }

    if (
      savedRange === "custom" &&
      (!savedCustomRange?.from || !savedCustomRange?.to)
    ) {
      return "all";
    }
    return savedRange;
  };

  const initialTimeRange = getInitialTimeRange();

  const [timeRange, setTimeRange] = useState(initialTimeRange);

  // What actually controls the API request.
  // This lets the custom form stay in draft mode until Apply is clicked.
  const [activeTimeRange, setActiveTimeRange] = useState(initialTimeRange);

  const [customFrom, setCustomFrom] = useState(savedCustomRange.from);

  const [customTo, setCustomTo] = useState(savedCustomRange.to);

  const [appliedCustomRange,setAppliedCustomRange] = useState(savedCustomRange);

  const [customPanelOpen,setCustomPanelOpen] = useState(false);

  const token = localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  // Search and filters
  const [search, setSearch] = useState("");

  const [categoryFilter,setCategoryFilter] = useState("All Categories");

  const [typeFilter,setTypeFilter] = useState("All Types");

  useEffect(() => {
    localStorage.setItem("transactionsTimeRange", activeTimeRange);
  }, [activeTimeRange]);

  useEffect(() => {
    if (appliedCustomRange?.from && appliedCustomRange?.to) {
      localStorage.setItem(
        "transactionsCustomRange",
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
      // Show Custom range in the select, but keep current page data
      // unchanged until the user applies dates.
      setTimeRange("custom");
      setCustomFrom(appliedCustomRange?.from);
      setCustomTo(appliedCustomRange?.to);
      setCustomPanelOpen(true);
      return;
    }

    // Preset ranges apply immediately.
    setTimeRange(value);
    setActiveTimeRange(value);
    setCustomPanelOpen(false);
  };

  const handleCancelCustomRange = () => {
    // Discard draft dates.
    setCustomFrom(appliedCustomRange?.from);

    setCustomTo(appliedCustomRange?.to);

    // Restore the filter that is still controlling the page.
    setTimeRange(activeTimeRange);
    setCustomPanelOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) {
      return;
    }

    if (customTo < customFrom) {
      toast.error("End date cannot be before start date");
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

  const handleClearCustomDates = () => {
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
        try {
          setLoading(true);

          const range = getDateRange(activeTimeRange,appliedCustomRange);

          const params = new URLSearchParams();

          if (range) {
            params.set("startDate", range.startDate);
            params.set("endDate", range.endDate
            );
          }

          const url = params.toString()
              ? `${API_URL}/api/transactions?${params.toString()}`
              : `${API_URL}/api/transactions`;

          const response = await authFetch(url);
          if (!response) return;

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch transactions");
          }

          setTransactions(data.transactions || []);
        } catch (error) {
          console.error("Failed to fetch transactions:", error.message);

          toast.error(error.message ||"Failed to load transactions");
        } finally {
          setLoading(false);
        }
      };

    fetchTransactions();
  }, [token, activeTimeRange, appliedCustomRange,]);

  //delete single transaction
  const deleteTransaction = async (transactionId) => {
  try {
    const response = await authFetch(
      `${API_URL}/api/transactions/${transactionId}`,
      {
        method: "DELETE",
      }
    );
    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete transaction");
    }

    setTransactions((current) =>
      current.filter(
        (transaction) =>
          transaction._id !== transactionId
      )
    );

    toast.success("Transaction deleted successfully");
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    toast.error(error.message || "Failed to delete transaction");
  }
};

//delete all transactions
const deleteAllTransactions = async () => {
  try {
    const response = await authFetch(
      `${API_URL}/api/transactions`,
      {
        method: "DELETE",
      }
    );
    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete all transactions");
    }
    setTransactions([]);

    toast.success("All transactions deleted successfully");
  } catch (error) {
    toast.error(error.message ||"Failed to delete transactions");
  }
};
  // Filter transactions
  const filteredTransactions =
    transactions.filter(
      (transaction) => {
        const searchMatch = 
          transaction.description ?.toLowerCase().includes(search.toLowerCase());

        const categoryMatch = 
          categoryFilter === "All Categories" ||transaction.category ===categoryFilter;

        const typeMatch = 
          typeFilter === "All Types" || transaction.type?.toLowerCase() ===typeFilter.toLowerCase();

        return (
          searchMatch &&
          categoryMatch &&
          typeMatch
        );
      }
    );


  const filtersActive = 
    search || categoryFilter !== "All Categories" ||typeFilter !=="All Types";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All Categories");
    setTypeFilter("All Types");
  };

  const formatCurrency = (value = 0) =>
    `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const getStatus = (transaction) =>
    transaction.category &&
    transaction.category !== "Uncategorized"? "Categorized" : "Needs review";

  const getCategoryClasses = (category) => {
    const categoryStyles = {
      Income: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",

      Restaurants: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",

      Groceries: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400",

      Shopping: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",

      Transportation:"bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",

      Travel: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",

      Entertainment:"bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",

      Subscription:"bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",

      Healthcare: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",

      Investment:"bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",

      Rent:"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",

      EMI:"bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    };

    return (
      categoryStyles[category] ||
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    );
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        </div>

        <Skeleton className="h-20 rounded-3xl" />

        <div className="space-y-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-16 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/*HEADER*/}

      <div className="space-y-4">
       <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

        {/* Left side */}
        <div className="min-w-0 flex-1">
          <Badge
            variant="secondary"
            className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF]"
          >
            Transaction history
          </Badge>

          <h1 className="text-3xl font-black tracking-tight text-[#07111F] dark:text-white">
            Transactions
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Search, filter and review your financial activity.
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
          {/* time range select */}
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="h-11 w-full min-w-[190px] rounded-xl sm:w-auto bg-white font-semibold">
              <div className="flex items-center gap-2">
                <CalendarRange className="size-4 text-[#4F6BFF]" />
                <span>{TIME_RANGE_LABELS[timeRange]}</span>
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

          {/* applied range */}
          {activeTimeRange === "custom" &&
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
                className="h-11 w-full min-w-[230px] rounded-xl sm:w-auto"
              >
                <CalendarIcon className="mr-2 size-4 text-[#4F6BFF]" />
                {format(appliedCustomRange.from, "dd MMM yyyy")} –{" "}
                {format(appliedCustomRange.to, "dd MMM yyyy")}
              </Button>
            )}

          {/* transaction count */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <ReceiptText className="size-4" />
            <span>
              {filteredTransactions.length} of {transactions.length} transactions
            </span>
          </div>

          {/* delete all */}
          {transactions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  />
                }
              >
                Delete all
              </AlertDialogTrigger>

              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle> Delete all transactions? </AlertDialogTitle>

                  <AlertDialogDescription>
                    This will permanently delete all your transactions and uploaded statement history.This action cannot be undone.
                  </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel> Cancel </AlertDialogCancel>

                  <AlertDialogAction
                    onClick={deleteAllTransactions}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete all transactions
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
                
            </AlertDialog>
          )}
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
                          customFrom
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-slate-400"
                        }
                      >
                        {customFrom
                          ? format(customFrom, "dd MMM yyyy")
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
                            new Date(
                              new Date().getFullYear() + 5,
                              11
                            )
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
                          ? format(customTo, "dd MMM yyyy")
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
                        disabled={(date) =>customFrom
                            ? date < customFrom
                            : false
                        }
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={new Date(new Date().getFullYear() + 5,11)}
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

      {/*FILTERS */}

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
        <CardContent className="p-4 sm:p-5">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
              />
            </div>

            {/* Category */}

            <div className="relative sm:min-w-48">
              <select
                value={categoryFilter}
                onChange={(e) =>setCategoryFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-600 outline-none transition focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:bg-slate-950"
              >
                <option>All Categories</option>
                <option>Restaurants</option>
                <option>Groceries</option>
                <option>Shopping</option>
                <option>Transportation</option>
                <option>Entertainment</option>
                <option>Subscription</option>
                <option>Healthcare</option>
                <option>Insurance</option>
                <option>Mortgage</option>
                <option>Utilities</option>
                <option>Rent</option>
                <option>Travel</option>
                <option>Education</option>
                <option>Personal Care</option>
                <option>Transfer</option>
                <option>Fees</option>
                <option>Income</option>
                <option>EMI</option>
                <option>Investment</option>
              </select>
            </div>

            {/* Type */}
            <div className="sm:min-w-40">
              <select
                value={typeFilter}
                onChange={(e) =>setTypeFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 outline-none transition focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:bg-slate-950"
              >
                <option>All Types</option>
                <option>Income</option>
                <option>Expense</option>
              </select>
            </div>

            {/* Clear */}
            {filtersActive && (
              <button onClick={clearFilters}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>

          {/* active filter indicator */}
          {filtersActive && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <SlidersHorizontal
                size={14}
              />
              Filters applied
            </div>
          )}
        </CardContent>
      </Card>

      {/* DESKTOP TABLE*/}

      <Card className="hidden overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-[#081321]">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Transaction
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Category
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Type
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Amount
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {filteredTransactions.length >
              0 ? (
                filteredTransactions.map(
                  (transaction) => {
                    const status =getStatus(transaction);
                    const isIncome =transaction.type?.toLowerCase() ==="income";

                    return (
                      <tr
                        key={transaction._id}
                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        {/* Date */}

                        <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">
                          {formatDate(transaction.date)}
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                isIncome
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft size={17}/>
                              ) : (
                                <ArrowUpRight size={17}/>
                              )}
                            </div>

                            <p className="max-w-xs truncate font-semibold text-[#07111F] dark:text-white">
                              {transaction.description}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryClasses(
                              transaction.category
                            )}`}
                          > 
                          {transaction.category || "Uncategorized"}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span
                            className={`capitalize ${
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                          {transaction.type}
                          </span>
                        </td>

                        {/* Amount */}
                        <td
                          className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-[#07111F] dark:text-white"
                          }`}
                        >
                          {isIncome
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            transaction.amount
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              status ===
                              "Categorized"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                status ===
                                "Categorized" ? "bg-emerald-500": "bg-amber-500"}`}
                            />
                            {status}
                          </span>
                        </td>

                        {/*delete action*/}
                        <td className="px-6 py-4 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                aria-label="Delete transaction"
                              />
                            }
                          >
                            <Trash2 size={16} />
                          </AlertDialogTrigger>

                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete transaction?</AlertDialogTitle>

                              <AlertDialogDescription>
                                This will permanently delete{" "}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {transaction.description}
                                </span>{" "}
                                from your transaction history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>

                              <AlertDialogAction
                                onClick={() =>
                                  deleteTransaction(transaction._id)
                                }
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                Delete transaction
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        </td>
                        </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-16 text-center"
                      >
                        <div className="mx-auto flex max-w-xs flex-col items-center">

                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <ReceiptText size={21}/>
                          </div>

                          <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                            No transactions found
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

      {/*MOBILE TRANSACTION CARD */}

      <div className="space-y-3 md:hidden">

        {filteredTransactions.length >
        0 ? (
          filteredTransactions.map(
            (transaction) => {const status = getStatus(transaction);

              const isIncome = transaction.type?.toLowerCase() === "income";

              return (
                <Card
                  key={transaction._id}
                  className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]"
                >
                  <CardContent className="p-4">
                    {/* Top */}
                    <div className="flex items-start gap-3">

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={18}/>
                        ) : (
                          <ArrowUpRight size={18}/>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#07111F] dark:text-white">
                              {transaction.description}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(transaction.date)}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 font-bold ${
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-[#07111F] dark:text-white"
                            }`}
                          >
                            {isIncome
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              transaction.amount
                            )}
                          </p>
                        </div>

                        {/* Bottom */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryClasses(
                              transaction.category
                            )}`}
                          >
                            {transaction.category ||"Uncategorized"}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              status ===
                              "Categorized"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            {status}
                          </span>

                          <span className="text-xs capitalize text-slate-400">
                            {transaction.type}
                          </span>
                          <div className="ml-auto">
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <button
                                  type="button"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                  aria-label="Delete transaction"
                                />
                              }
                            >
                              <Trash2 size={15} />
                            </AlertDialogTrigger>

                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete transaction?
                                </AlertDialogTitle>

                                <AlertDialogDescription>
                                  This will permanently delete{" "}
                                  <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {transaction.description}
                                  </span>
                                  . This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  onClick={() =>
                                    deleteTransaction(transaction._id)
                                  }
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Delete transaction
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )
        ) : (
          <Card className="rounded-3xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#081321]">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <ReceiptText
                  size={21}
                />
              </div>

              <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                No transactions found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your
                search or filters.
              </p>

              {filtersActive && (
                <button
                  onClick={
                    clearFilters
                  }
                  className="mt-5 text-sm font-semibold text-[#4F6BFF]"
                >
                  Clear filters
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
export default Transactions;