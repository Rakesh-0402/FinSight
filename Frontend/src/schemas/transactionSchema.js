import { z } from "zod";

export const manualExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Merchant or description is required")
    .max(100, "Description is too long"),

  amount: z
    .number({
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),

  date: z
    .string()
    .min(1, "Date is required"),
});