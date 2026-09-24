import pandas as pd
import numpy as np

COLUMN_ALIASES = {
    "date": [
        "date",
        "transaction_date",
        "txn_date",
        "value_date",
    ],
    "description": [
        "description",
        "narration",
        "details",
        "transaction_details",
        "remarks",
    ],
    "debit": [
        "debit",
        "withdrawal",
        "withdrawal_amount",
    ],
    "credit": [
        "credit",
        "deposit",
        "deposit_amount",
    ],
    "amount": [
        "amount",
        "transaction_amount",
    ],
    "type": [
        "type",
        "transaction_type",
    ],
}


def normalize_column_name(column):
    return (
        str(column)
        .strip()
        .lower()
        .replace(" ", "_")
    )


def find_column(columns, aliases):
    for alias in aliases:
        if alias in columns:
            return alias

    return None


def clean_transactions(df):
    # Remove completely empty rows and columns
    df = df.dropna(how="all")
    df = df.dropna(axis=1, how="all")

    # Normalize column names
    df.columns = [
        normalize_column_name(column)
        for column in df.columns
    ]

    # Remove duplicate rows
    df = df.drop_duplicates()

    columns = df.columns.tolist()

    date_col = find_column(columns, COLUMN_ALIASES["date"])
    description_col = find_column(columns, COLUMN_ALIASES["description"])
    debit_col = find_column(columns, COLUMN_ALIASES["debit"])
    credit_col = find_column(columns, COLUMN_ALIASES["credit"])
    amount_col = find_column(columns, COLUMN_ALIASES["amount"])
    type_col = find_column(columns, COLUMN_ALIASES["type"])

    # Date
    if date_col:
        df["date"] = pd.to_datetime(
            df[date_col],
            errors="coerce"
        )

    # Description
    if description_col:
        df["description"] = (
            df[description_col]
            .fillna("")
            .astype(str)
            .str.strip()
        )
    else:
        df["description"] = ""

    # Amount + type
    if debit_col or credit_col:
        debit = (
            pd.to_numeric(df[debit_col], errors="coerce")
            if debit_col
            else pd.Series(0, index=df.index)
        )

        credit = (
            pd.to_numeric(df[credit_col], errors="coerce")
            if credit_col
            else pd.Series(0, index=df.index)
        )

        df["amount"] = debit.fillna(0) + credit.fillna(0)

        df["type"] = np.where(
            credit.fillna(0) > 0,
            "income",
            "expense"
        )

    elif amount_col:
        df["amount"] = pd.to_numeric(
            df[amount_col],
            errors="coerce"
        )

        if type_col:
            df["type"] = (
                df[type_col]
                .fillna("")
                .astype(str)
                .str.strip()
                .str.lower()
            )
        else:
            df["type"] = "expense"

    

    # Normalize transaction types
    df["type"] = df["type"].replace({
        "withdrawal": "expense",
        "debit": "expense",
        "expense": "expense",
        "deposit": "income",
        "credit": "income",
        "income": "income",
        "transfer":"transfer" ,
    })
    # Remove invalid transactions
    df = df.dropna(subset=["date", "amount"])

    df = df[df["amount"] > 0]

    # Standard output
    result = df[
        ["date", "description", "amount", "type"]
    ].copy()

    result["category"] = "Uncategorized"
    result["source"] = "bank_csv"
    result["confidence"] = None
    result["isAnomaly"] = False

    # Convert date to string for API response
    result["date"] = result["date"].dt.strftime("%Y-%m-%d")

    return result