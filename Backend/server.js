import "dotenv/config";
import helmet from "helmet";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import forecastRoutes from "./routes/forecastRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import accountAggregatorRoutes from "./routes/accountAggregatorRoutes.js";
import moneyPlanRoutes from "./routes/moneyPlanRoutes.js"
import insightsRoutes from "./routes/insightsRoutes.js";

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin : process.env.FRONTEND_URL,
  credentials : true,
}));
app.use(helmet());//adds the protection around the cross-origin resource behaviour

app.use(express.json());
connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "Financial Intelligence API is running",
  });
});

app.use("/api/transactions" , transactionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/insights",insightRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/accounts", accountRoutes);
app.use(
  "/api/account-aggregator",
  accountAggregatorRoutes
);
app.use("/api/money-plan" , moneyPlanRoutes);
app.use("/api/insights", insightsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});