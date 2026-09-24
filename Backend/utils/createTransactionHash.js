import crypto from "crypto";

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const createTransactionHash = (
  transactions
) => {
  const normalized =
    transactions
      .map((transaction) => {
        const date =
          transaction.date
            ? new Date(
                transaction.date
              )
                .toISOString()
                .slice(0, 10)
            : "";

        const description =
          normalizeText(
            transaction.description
          );

        const amount =
          Number(
            transaction.amount || 0
          ).toFixed(2);

        const type =
          normalizeText(
            transaction.type
          );

        return [
          date,
          description,
          amount,
          type,
        ].join("|");
      })
      .sort();

  const content =
    normalized.join("\n");

  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
};