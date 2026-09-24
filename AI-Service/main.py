from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import io

from services.cleaning import clean_transactions
from services.categorization import (
    categorize_transactions,
    categorize_transaction_with_confidence
)

from services.anomaly_detection import detect_anomalies
from services.forecasting import forecast_expenses

from pydantic import BaseModel
from typing import List


app = FastAPI(
    title="Financial Intelligence AI Service"
)
# REQUEST MODELS


class TransactionRequest(BaseModel):
    description: str


class AnomalyTransaction(BaseModel):
    id: str
    amount: float
    category: str


class AnomalyRequest(BaseModel):
    transactions: List[AnomalyTransaction]

class MonthlyExpense(BaseModel):
    year: int
    month: int
    expenses: float


class ForecastRequest(BaseModel):
    monthlyData: List[MonthlyExpense]

# ROOT

@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Service is running"
    }

# CSV PROCESSING

@app.post("/process-transactions")
async def process_transactions(
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()  #reads the csv file

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="CSV file is empty"
            )

        try:
            df = pd.read_csv(io.BytesIO(contents))

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid CSV content"
            )

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="CSV contains no transactions"
            )

        cleaned_df = clean_transactions(df) #cleans all the transactions 

        # Normalize standardized columns after cleaning 
        cleaned_df.columns = [
            str(column).strip().lower()
            for column in cleaned_df.columns
        ]

        REQUIRED_COLUMNS = {
                    "date",
                    "description",
                    "amount"
        }

        missing_columns = (
            REQUIRED_COLUMNS
            - set(cleaned_df.columns)
        )

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid CSV format. Missing required columns: "
                    + ", ".join(sorted(missing_columns))
                )
            )

        # maximum no of transactions
        if len(cleaned_df) > 10000:
            raise HTTPException(
                status_code=400,
                detail="CSV contains too many transactions"
            )

        # Validate amount
        cleaned_df["amount"] = pd.to_numeric(
            cleaned_df["amount"],
            errors="coerce"
        )

        if cleaned_df["amount"].isna().any():
            raise HTTPException(
                status_code=400,
                detail="CSV contains invalid transaction amounts"
            )

        # Validate date
        parsed_dates = pd.to_datetime(
            cleaned_df["date"],
            errors="coerce"
        )

        if parsed_dates.isna().any():
            raise HTTPException(
                status_code=400,
                detail="CSV contains invalid transaction dates"
            )

        cleaned_df["date"] = parsed_dates

        # Categorize only after validation
        categorized_df = categorize_transactions(
            cleaned_df
        )

        transactions = categorized_df.to_dict(
            orient="records"
        )
 
        return {
            "success": True,
            "count": len(transactions),
            "transactions": transactions
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# -----------------------------------------
# MANUAL CATEGORIZATION
# -----------------------------------------

@app.post("/categorize")
async def categorize_manual_transaction(
    transaction: TransactionRequest
):

    result = categorize_transaction_with_confidence(
        transaction.description
    )

    return {
        "success": True,
        "category": result["category"],
        "confidence": result["confidence"]
    }


# -----------------------------------------
# ANOMALY DETECTION
# -----------------------------------------

@app.post("/detect-anomalies")
async def detect_transaction_anomalies(
    request: AnomalyRequest
):

    transactions = [
        transaction.model_dump()
        for transaction in request.transactions
    ]

    results = detect_anomalies(transactions)

    return {
        "success": True,
        "count": len(results),
        "anomalies": results
    }

# predict future expenses - forecasting
@app.post("/forecast-expenses")
async def forecast_future_expenses(
    request: ForecastRequest
):
    monthly_data = [
        item.model_dump()
        for item in request.monthlyData
    ]

    result = forecast_expenses(
        monthly_data,
    )

    return result