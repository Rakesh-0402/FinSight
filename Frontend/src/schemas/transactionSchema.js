import { z } from "zod";

export const manualTransactionSchema = z
  .object({
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

    type: z.enum([
      "income",
      "expense",
      "transfer",
      "credit_card_payment",
      "refund",
    ]),

    source: z.literal("manual"),

    account: z
      .string()
      .min(1, "Please select an account"),

    transferAccount: z
      .string()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const needsDestination =
      data.type === "transfer" ||
      data.type === "credit_card_payment";

    if (needsDestination && !data.transferAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferAccount"],
        message: "Please select a destination account",
      });
    }

    if (
      needsDestination &&
      data.account &&
      data.transferAccount &&
      data.account === data.transferAccount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferAccount"],
        message: "Source and destination accounts cannot be the same",
      });
    }
  });