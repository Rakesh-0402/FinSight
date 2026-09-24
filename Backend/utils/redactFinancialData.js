export const redactFinancialText = (value = "") => {
  let text = String(value);

  // Email / UPI-like IDs
  text = text.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b/g,
    "[REDACTED_ID]"
  );

  // Indian phone numbers
  text = text.replace(
    /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g,
    "[REDACTED_PHONE]"
  );

  // Long numeric references / account / transaction IDs
  text = text.replace(
    /\b\d{10,}\b/g,
    "[REDACTED_REFERENCE]"
  );

  // Common masked/full card-number-like sequences
  text = text.replace(
    /\b(?:\d[ -]*?){13,19}\b/g,
    "[REDACTED_CARD]"
  );

  return text;
};
//transaction sanitizer
export const sanitizeTransactionForAI = (
  transaction
) => ({
  date: transaction.date,
  description: redactFinancialText(
    transaction.description
  ),
  amount: transaction.amount,
  type: transaction.type,
  category: transaction.category,
  isAnomaly: transaction.isAnomaly,
  anomalyScore: transaction.anomalyScore,
});