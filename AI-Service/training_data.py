from datasets import load_dataset
import pandas as pd

# --------------------------------------------------
# 1. Load US dataset
# --------------------------------------------------

us_dataset = load_dataset(
    "DoDataThings/us-bank-transaction-categories-v2",
    split="train"
)

us_df = us_dataset.to_pandas()

us_df = us_df[["description", "category"]]


# --------------------------------------------------
# 2. Load Indian dataset
# --------------------------------------------------

# After downloading the Kaggle dataset,
# place the training CSV here:
#
# data/indian_transactions_train.csv

indian_df = pd.read_csv(
    "data/indian_transactions_train.csv"
)
print("Indian dataset columns:")
print(indian_df.columns.tolist())

print("\nFirst 5 rows:")
print(indian_df.head())


# --------------------------------------------------
# 3. Rename Indian columns
# --------------------------------------------------

indian_df = indian_df.rename(columns={
    "Transaction_Text": "description",
    "Label": "category"
})

indian_df = indian_df[["description", "category"]]


# --------------------------------------------------
# 4. Map Indian categories
# --------------------------------------------------

INDIAN_CATEGORY_MAP = {
    "Food": "Restaurants",
    "Travel": "Travel",
    "Shopping": "Shopping",
    "EMI": "EMI",
    "Investment": "Investment",
}

indian_df["category"] = indian_df["category"].map(
    INDIAN_CATEGORY_MAP
)


# --------------------------------------------------
# 5. Remove invalid rows
# --------------------------------------------------

indian_df = indian_df.dropna(
    subset=["description", "category"]
)

indian_df["description"] = (
    indian_df["description"]
    .astype(str)
    .str.strip()
)

indian_df = indian_df[
    indian_df["description"] != ""
]


# --------------------------------------------------
# 6. Combine both datasets
# --------------------------------------------------

combined_df = pd.concat(
    [us_df, indian_df],
    ignore_index=True
)


# --------------------------------------------------
# 7. Shuffle
# --------------------------------------------------

combined_df = combined_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


# --------------------------------------------------
# 8. Save final training dataset
# --------------------------------------------------

combined_df.to_csv(
    "data/transactions_training.csv",
    index=False
)


# --------------------------------------------------
# 9. Print information
# --------------------------------------------------

print("Combined dataset:")
print(combined_df.shape)

print("\nCategory distribution:")
print(combined_df["category"].value_counts())

print("\nCategories:")
print(sorted(combined_df["category"].unique()))