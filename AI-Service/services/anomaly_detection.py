
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


def detect_anomalies(transactions):
    """
    Detect unusually high expense transactions.

    Expected fields:
        id
        amount
        category

    Combines:
        1. A robust high-spending rule
        2. Isolation Forest, restricted to high-spending candidates

    Low spending alone is not treated as an anomaly.
    """

    if not transactions:
        return []

    df = pd.DataFrame(transactions)

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce",
    )

    df = df.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    df = df.dropna(subset=["amount"])
    df = df[df["amount"] > 0].copy()

    if df.empty:
        return []

    df["category"] = (
        df["category"]
        .fillna("Other")
        .astype(str)
        .str.strip()
        .replace("", "Other")
    )

    if len(df) < 10:
        return [
            {
                "id": str(row["id"]),
                "isAnomaly": False,
                "anomalyScore": 0.0,
            }
            for _, row in df.iterrows()
        ]

    amounts = df["amount"].to_numpy(dtype=float)

    # -------------------------------------------
    # GLOBAL SPENDING BASELINE
    # -------------------------------------------

    median_amount = float(np.median(amounts))

    q1, q3 = np.percentile(
        amounts,
        [25, 75],
    )

    iqr = float(q3 - q1)

    # Strong threshold for exceptionally large
    # expenses. This rule can flag multiple purchases.
    high_amount_threshold = max(
        float(q3 + 3 * iqr),
        median_amount * 5,
    )

    high_amount_flags = (
        amounts > high_amount_threshold
    )

    # A less restrictive upper-tail threshold.
    # Used to decide whether an Isolation Forest
    # outlier is actually a high-spending concern.
    elevated_amount_threshold = max(
        float(q3 + 1.5 * iqr),
        median_amount * 3,
    )

    # -------------------------------------------
    # CATEGORY FEATURES
    # -------------------------------------------

    category_counts = df.groupby(
        "category"
    )["amount"].transform("count")

    category_medians = df.groupby(
        "category"
    )["amount"].transform("median")

    # Categories with very little history do not
    # provide a reliable category-specific baseline.
    # Give them a neutral ratio instead.
    df["categoryRatio"] = np.where(
        category_counts >= 4,
        df["amount"] / category_medians.clip(lower=1),
        1.0,
    )

    df["logAmount"] = np.log1p(
        df["amount"]
    )

    features = df[
        [
            "logAmount",
            "categoryRatio",
        ]
    ]

    # -------------------------------------------
    # ISOLATION FOREST
    # -------------------------------------------

    model = IsolationForest(
        n_estimators=100,
        contamination="auto",
        random_state=42,
    )

    model_predictions = model.fit_predict(
        features
    )

    raw_scores = -model.score_samples(
        features
    )

    # Isolation Forest can identify both unusually
    # small and unusually large transactions.
    # Only accept its flags when spending is elevated.
    model_high_spending_flags = (
        (model_predictions == -1)
        & (amounts > elevated_amount_threshold)
    )

    # Strong amount outliers are independently flagged.
    final_flags = (
        high_amount_flags
        | model_high_spending_flags
    )

    # -------------------------------------------
    # DISPLAY SCORES
    # -------------------------------------------

    min_score = float(raw_scores.min())
    max_score = float(raw_scores.max())

    if max_score > min_score:
        normalized_scores = (
            (raw_scores - min_score)
            / (max_score - min_score)
        )
    else:
        normalized_scores = np.zeros(
            len(raw_scores)
        )

    # Strong high-spending outliers receive at least
    # a 0.75 display score.
    normalized_scores = np.where(
        high_amount_flags,
        np.maximum(normalized_scores, 0.75),
        normalized_scores,
    )

    # Do not show an anomaly strength for transactions
    # that were not actually flagged.
    normalized_scores = np.where(
        final_flags,
        normalized_scores,
        0.0,
    )

    results = []

    for index, (_, row) in enumerate(df.iterrows()):
        results.append(
            {
                "id": str(row["id"]),
                "isAnomaly": bool(final_flags[index]),
                "anomalyScore": round(
                    float(normalized_scores[index]),
                    3,
                ),
            }
        )

    return results