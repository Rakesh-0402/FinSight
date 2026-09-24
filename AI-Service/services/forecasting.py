
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression

# missing months does not mean zero expenses we will let the user confirms it
def forecast_expenses(monthly_data):
    def failure(message):
        return {
            "success": False,
            "message": message,
            "forecast": [],
        }

    if not monthly_data:
        return failure("No monthly expense data available")

    df = pd.DataFrame(monthly_data)

    required_columns = {"year", "month", "expenses"}

    if not required_columns.issubset(df.columns):
        return failure("Invalid monthly expense data")

    df = df[["year", "month", "expenses"]].copy()

    for column in ["year", "month", "expenses"]:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    # Reject invalid data rather than silently removing rows.
    if df.isna().any().any():
        return failure("Monthly expense data contains invalid values")

    if not np.isfinite(
        df[["year", "month", "expenses"]].to_numpy(dtype=float)
    ).all():
        return failure("Monthly expense data contains invalid values")

    if (
        (df["year"] != np.floor(df["year"])).any()
        or (df["month"] != np.floor(df["month"])).any()
        or (df["month"] < 1).any()
        or (df["month"] > 12).any()
        or (df["expenses"] < 0).any()
    ):
        return failure("Invalid month or expense amount")

    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].astype(int)
    df["expenses"] = df["expenses"].astype(float)

    try:
        df["date"] = pd.to_datetime(
            dict(
                year=df["year"],
                month=df["month"],
                day=1,
            )
        )
    except (ValueError, TypeError):
        return failure("Invalid calendar date")

    # Each calendar month must appear exactly once.
    if df["date"].duplicated().any():
        return failure("Duplicate monthly expense data")

    df = df.sort_values("date").reset_index(drop=True)

    historical_months = len(df)

    if historical_months < 6:
        return failure(
            "At least 6 consecutive months of known expense history are required"
        )

    # Verify continuity. Never invent zero-expense months.
    month_numbers = (
        df["year"].to_numpy() * 12
        + df["month"].to_numpy()
    )

    if not np.all(np.diff(month_numbers) == 1):
        return failure(
            "Expense history contains unconfirmed missing months"
        )

    # -----------------------------------
    # Feature engineering
    # -----------------------------------

    df["time_index"] = np.arange(historical_months)

    df["rolling_3"] = (
        df["expenses"]
        .rolling(window=3, min_periods=1)
        .mean()
    )

    recent_values = (
        df["expenses"]
        .tail(min(3, historical_months))
        .to_numpy()
    )

    if len(recent_values) == 1:
        recent_weighted_average = float(recent_values[0])
    else:
        weights = np.arange(1, len(recent_values) + 1)

        recent_weighted_average = float(
            np.average(recent_values, weights=weights)
        )

    # -----------------------------------
    # Linear trend component
    # -----------------------------------

    X = df[["time_index"]]
    y = df["expenses"]

    model = LinearRegression()
    model.fit(X, y)

    next_time_index = historical_months

    trend_prediction = float(
        model.predict(
            pd.DataFrame({
                "time_index": [next_time_index]
            })
        )[0]
    )

    # -----------------------------------
    # Existing hybrid prediction
    # -----------------------------------

    latest_rolling_average = float(
        df["rolling_3"].iloc[-1]
    )

    predicted_expense = (
        0.40 * recent_weighted_average
        + 0.35 * latest_rolling_average
        + 0.25 * trend_prediction
    )

    predicted_expense = max(predicted_expense, 0.0)

    # -----------------------------------
    # Existing estimated range
    # -----------------------------------

    residuals = y - model.predict(X)

    residual_std = float(
        residuals.std()
        if len(residuals) > 1
        else 0
    )

    lower_bound = max(
        predicted_expense - residual_std,
        0.0,
    )

    upper_bound = predicted_expense + residual_std

    # -----------------------------------
    # Forecast the following calendar month
    # -----------------------------------

    last_date = df["date"].iloc[-1]

    next_date = last_date + pd.DateOffset(months=1)

    return {
        "success": True,
        "historicalMonths": historical_months,
        "model": "hybrid_trend",
        "forecast": [
            {
                "year": int(next_date.year),
                "month": int(next_date.month),
                "predictedExpenses": round(predicted_expense, 2),
                "lowerBound": round(lower_bound, 2),
                "upperBound": round(upper_bound, 2),
            }
        ],
    }