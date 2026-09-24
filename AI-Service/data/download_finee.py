from datasets import load_dataset
import pandas as pd
import json

dataset = load_dataset("Ranjit0034/finee-dataset")

rows = []

for item in dataset["train"]:
    messages = item.get("messages", [])

    # Find assistant response
    assistant_message = next(
        (
            msg.get("content")
            for msg in messages
            if msg.get("role") == "assistant"
        ),
        None,
    )

    if not assistant_message:
        continue

    try:
        output = json.loads(assistant_message)
    except (json.JSONDecodeError, TypeError):
        continue

    date = output.get("date")
    amount = output.get("amount")
    merchant = output.get("merchant")
    beneficiary = output.get("beneficiary")
    transaction_type = output.get("type")
    category = output.get("category")

    if not date or amount is None:
        continue

    rows.append({
        "date": date,
        "description": (
            merchant
            or beneficiary
            or "Unknown transaction"
        ),
        "amount": amount,
        "type": (
            "income"
            if transaction_type == "credit"
            else "expense"
        ),
        "category": category or "Uncategorized",
    })

df = pd.DataFrame(rows)

df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce"
)

df = df.dropna(subset=["date"])

df = df.sort_values("date")

print("Available date range:")
print(df["date"].min(), "to", df["date"].max())
print("Total usable transactions:", len(df))

# Take first 6 months
start_date = df["date"].min()
end_date = start_date + pd.DateOffset(months=6)

six_months = df[
    (df["date"] >= start_date)
    & (df["date"] < end_date)
].copy()

six_months.to_csv(
    "data/finee_6_months.csv",
    index=False
)

print("\nCSV created successfully")
print("Rows:", len(six_months))
print(six_months.head())

six_months["date"].dt.to_period("M").value_counts().sort_index()