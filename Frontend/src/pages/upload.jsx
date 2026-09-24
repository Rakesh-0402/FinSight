import { API_URL } from "@/lib/utils";
import { useState } from "react";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { manualExpenseSchema } from "@/schemas/transactionSchema";
import {
  UploadCloud,
  FileText,
  ReceiptText,
  Sparkles,
  BrainCircuit,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {Badge} from "@/components/ui/badge";

// Use the user's local calendar date, not UTC, as the latest allowed expense date.
const getTodayLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);

  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);

  const [description,setDescription] = useState("");

  const [amount, setAmount] = useState("");

  const [date, setDate] = useState("");

  const handleSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv" && !selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    setFile(selectedFile);
    toast.success("CSV file selected");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    handleSelectedFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

  const formData = new FormData();
  formData.append("file", file);
    try {
      const response = await authFetch(`${API_URL}/api/upload/csv`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail ||"CSV upload failed");
      }

      toast.success(`${data.count} transactions uploaded successfully`);
      setFile(null);
    }
    catch (error) {
      console.error("Upload failed:",error);

      if (error instanceof TypeError || error.message ==="Failed to fetch"){
          toast.error("Unable to connect to the server. Please make sure the backend and AI service are running.");
          return;
      }
      toast.error(error.message || "CSV format is invalid");
    }
  };

  //manual expense form
  const handleAddExpense =
    async (e) => {
      e.preventDefault();

      try {
        if (date && date > getTodayLocalDate()) {
          toast.error("Future dates are not allowed for manual expenses");
          return;
        }

        const result = manualExpenseSchema.safeParse({
          description,
          amount: Number(amount),
          date,
          type: "expense",
          source: "manual",
        });

        if (!result.success) {
          const firstError = result.error.issues[0]?.message;
          toast.error(firstError || "Please check your inputs");
          return;
        }
        const response = await authFetch(`${API_URL}/api/transactions`,
            {
              method: "POST",
              headers: {
                "Content-Type":"application/json",
              },

              body: JSON.stringify(result.data),
            }
          );
          if (!response) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        toast.success("Expense added successfully");
        setDescription("");
        setAmount("");
        setDate("");
      } 
      catch (error) {
        console.error("Add expense failed:",error);
        toast.error(error.message ||"Failed to add expense");
      }
    };

  const steps = [
    {
      title: "Upload / Add",
      description: "Import a CSV or record a cash expense manually.",
      icon: UploadCloud,
      iconClass:"bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]",
    },

    {
      title: "Data Cleaning",
      description:"Normalize transaction fields and prepare the data.",
      icon: FileText,
      iconClass:"bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
    },

    {
      title: "NLP + ML Categorization",
      description:"Classify transactions into financial categories.",
      icon: BrainCircuit,
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    },

    {
      title: "Financial Analysis",
      description:"Use the processed data across insights and analytics.",
      icon: BarChart3,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">

      {/*HEADER */}

      <div>
        <Badge
          variant="secondary"
          className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
        >
          Add financial data
        </Badge>

        <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">Add Transactions</h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Upload bank transactions
          or manually record cash
          expenses.
        </p>
      </div>

      {/*MAIN GRID */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/*CSV UPLOAD */}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">

          <CardHeader>

            <div className="flex items-start justify-between gap-4">

              <div className="flex gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                  <UploadCloud
                    size={20}
                  />
                </div>

                <div>
                  <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                    Upload Bank Statement
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Upload a CSV file containing your transaction history.
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className="hidden rounded-full sm:inline-flex"
              >
                CSV only
              </Badge>
            </div>
          </CardHeader>

          <CardContent>

           <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                isDragging
                  ? "border-[#4F6BFF] bg-[#4F6BFF]/5 ring-4 ring-[#4F6BFF]/10"
                  : "border-slate-200 bg-slate-50/70 hover:border-[#4F6BFF]/50 hover:bg-[#4F6BFF]/[0.03] dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-[#4F6BFF]/50 dark:hover:bg-[#4F6BFF]/5"
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-all duration-300 dark:bg-slate-800 ${
                  isDragging
                    ? "scale-110 text-[#4F6BFF]"
                    : "text-[#4F6BFF] group-hover:-translate-y-1 dark:text-[#8EA0FF]"
                }`}
              >
                <UploadCloud size={25} />
              </div>

              <p className="mt-5 text-sm font-semibold text-[#07111F] dark:text-white">
                {isDragging
                  ? "Drop your CSV file here"
                  : file
                  ? file.name
                  : "Choose or drag a CSV file"}
              </p>

              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400 dark:text-slate-500">
                Drag and drop your bank statement here, or click to browse.
              </p>

              {file && !isDragging && (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  File selected
                </div>
              )}

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleSelectedFile(e.target.files?.[0])}
                className="hidden"
              />
            </label>

            {file && (
              <button onClick={handleUpload}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-[#07111F]"
              >
                <Sparkles size={17}/>
                Process Transactions
              </button>
            )}
          </CardContent>
        </Card>

        {/*MANUAL EXPENSE*/}

        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
          <CardHeader>
            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <ReceiptText size={20}/>
              </div>

              <div>
                <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                  Add Cash Expense
                </CardTitle>

                <CardDescription className="mt-1">
                  Record expenses that do not appear in your bank statement.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>

            <form
              onSubmit={handleAddExpense}
              className="space-y-5"
            >
              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Merchant
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) =>setDescription(e.target.value)}
                  placeholder="e.g. Metro ticket"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) =>setAmount(e.target.value)}
                    placeholder="200"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Date
                </label>

                <input
                  type="date"
                  max={getTodayLocalDate()}
                  value={date}
                  onChange={(e) =>setDate(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-[#07111F]"
              >
                <ReceiptText size={17}/>
                Add Expense
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* PROCESSING FLOW */}

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
            How your transactions are processed
          </CardTitle>

          <CardDescription>
            From raw transaction data to financial intelligence.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(
              (
                {
                  title,
                  description,
                  icon: Icon,
                  iconClass,
                },
                index
              ) => (
                <div
                  key={title}
                  className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
                    >
                      <Icon size={20}/>
                    </div>

                    <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
                      0{index + 1}
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-bold text-[#07111F] dark:text-white">
                    {title}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;