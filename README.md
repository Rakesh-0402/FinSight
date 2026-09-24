# FinSight

**AI-powered personal finance management** — organize transactions, understand spending habits, estimate next-month expenses, and review unusual spending in one place.

> **Project status:** Core user journey functionally tested. Deployment and production-readiness work are in progress. Forecasts and anomaly signals are estimates, not financial advice or fraud determinations.

## Features

- **Authentication and account management:** signup, login, protected routes, password reset by email, password change, profile settings, Light/Dark/System theme, and account deletion.
- **Transactions:** bank-statement CSV upload, manual expense entry, automated categorization, transaction history, date filters, and deletion.
- **Dashboard:** income, spending, balance, savings rate, transaction summaries, and date-range views.
- **Analytics:** expense categories, monthly income and spending, savings, spending trends, and largest expenses.
- **Expense forecasting:** next-month estimate using a hybrid of recent weighted spending, a three-month rolling average, and linear trend; estimated range and historical chart.
- **History completeness:** requires at least six consecutive *known* months; uses the full latest continuous history, including the current month. Users can confirm genuine zero-expense months or undo a confirmation. Missing history is never silently treated as zero.
- **Anomaly detection:** Isolation Forest and high-spending checks to surface unusual expenses, with scores and date filters. Signals do not necessarily indicate fraud.
- **AI financial assistant:** questions about available financial data, saved conversations, search, and chat deletion.
- **Notifications:** user-specific notifications with read/unread status.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, Tailwind CSS v4, shadcn/ui, Base UI, Recharts, React Router |
| Frontend utilities | Zod, Sonner, Lucide React |
| Backend | Node.js, Express, REST APIs |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| AI service | Python, FastAPI, pandas, NumPy, scikit-learn |
| Categorization | Merchant rules, TF-IDF, LinearSVC |
| Forecasting | Recent weighted average, three-month rolling average, linear regression |
| Anomaly detection | Isolation Forest and robust high-spending thresholds |

## Project structure

```text
FinSight/
├── Frontend/       # React + Vite application
├── Backend/        # Express API and MongoDB models
└── AI-Service/     # FastAPI endpoints and ML services
```

## How it works

```text
React frontend
      |
      v
Express REST API ----> MongoDB
      |
      v
FastAPI AI service
  |-- Transaction categorization
  |-- Expense forecasting
  `-- Anomaly detection
```

The Express API handles authentication and user-specific data. It calls the separate FastAPI service for machine-learning operations.

## Local development

### Prerequisites

- Node.js and npm
- Python and pip
- MongoDB connection
- Environment variables for each service

### 1. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` with the environment variables required by your server configuration, then start the backend using the script defined in `Backend/package.json`.

### 2. AI service

```bash
cd AI-Service
python -m venv .venv
```

Activate the virtual environment, then run:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env` with your backend base URL:

```dotenv
VITE_API_URL=http://localhost:YOUR_BACKEND_PORT
```

Start the frontend:

```bash
npm run dev
```

**Note:** Set the actual backend port and all other configuration values to match your local setup. The backend also requires the AI service URL and authentication/database/email settings. Do not commit real `.env` files.

## Forecasting data policy

A month without recorded transactions is **unknown**, not automatically a zero-spending month. To become a known month, it must contain recorded expenses or be explicitly confirmed by the user as having no expenses. The latest continuous sequence must contain at least six known months; older history separated by unknown gaps is not treated as consecutive. Actual recorded expenses take precedence over zero-month confirmations.

The current month is included using spending recorded so far, so forecasts may change as more transactions are added. The estimated range is an approximation, not a guaranteed outcome or a calibrated confidence interval.

## Privacy and security notes

- Transactions and forecasts are scoped to the authenticated user.
- Passwords are hashed; password-reset tokens are stored as hashes and expire.
- Keep database credentials, JWT secrets, email credentials, and other secrets in server-side environment variables.
- Never put secrets in `VITE_` variables: they are included in the frontend bundle.
- Do not commit real financial statements, uploads, or `.env` files to this repository.

## Deployment status

The project is being prepared for deployment. Production URLs will be added after the Express backend, FastAPI service, and frontend are deployed and connected.

## Disclaimer

FinSight is a personal-finance tracking and insights project. Forecasts and anomaly flags are informational estimates and should not be treated as financial advice or proof of fraud.
