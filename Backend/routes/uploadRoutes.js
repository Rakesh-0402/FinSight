import express from "express";
import multer from "multer";
import fs from "fs";
import Transaction from "../models/Transaction.js"
import { protectedRoute } from "../middleware/authmiddleware.js";
import UploadHistory from "../models/UploadHistory.js";
import { createTransactionHash } from "../utils/createTransactionHash.js";
import Notification from "../models/Notification.js"
import { uploadLimiter } from "../middleware/rateLimiters.js";
const router = express.Router();

//receives the  validated csv file
const upload = multer({
  dest: "uploads/",

  limits: {
    fileSize: 5 * 1024 * 1024, //5 MB
  },

  fileFilter: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase();

    const validExtension = fileName.endsWith(".csv");

    const validMimeType =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/csv";

    if (!validExtension || !validMimeType) {
      return cb(
        new Error("Only CSV files are allowed")
      );
    }

    cb(null, true);
  },
});

//add proper multer error handling
const csvUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message:
            "CSV file is too large. Maximum allowed size is 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Invalid CSV file",
      });
    }

    next();
  });
};
router.post("/csv", uploadLimiter, protectedRoute, csvUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const fileBuffer = await fs.promises.readFile(req.file.path);

    // Send CSV to Python FastAPI
    const formData = new FormData();

    formData.append(
      "file",
        new Blob([fileBuffer], { type: "text/csv" }),
        req.file.originalname
    );
    //process csv using fastAPI
    // Process CSV using FastAPI
    let response;

    try {
      response = await fetch(
        `${process.env.AI_SERVICE_URL}/process-transactions`,
        {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(120000), // 2 minutes
        }
      );
    } catch (error) {
      console.error("CSV AI connection error:", error);

      return res.status(503).json({
        success: false,
        message:
          "AI processing service is starting or temporarily unavailable. Please try again shortly.",
      });
    }

    // Read as text first because Render may return an HTML error page.
    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "CSV AI service failed:",
        response.status,
        responseText.slice(0, 500)
      );

      return res.status(503).json({
        success: false,
        message:
          "AI processing service is temporarily unavailable. Please try again shortly.",
      });
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "CSV AI returned invalid JSON:",
        responseText.slice(0, 500)
      );

      return res.status(502).json({
        success: false,
        message: "AI processing service returned an invalid response.",
      });
    }
    const transactions = data.transactions || [];

    //empty transactions section
    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message:"No valid transactions found in CSV",
      });
    }

    //generate content hash
    const contentHash = createTransactionHash(transactions);

    //check existing  upload history
    const existingUpload = await UploadHistory.findOne({
        user: req.user._id,
        contentHash,
    });

    if (existingUpload) {
      const existingTransactionCount = await Transaction.countDocuments({
          user: req.user._id,
          uploadId: existingUpload._id,
      });

      //transactions still exist -> reject duplicate csv file //duplicate detection
      if (existingTransactionCount > 0) {
        return res.status(409).json({
          success: false,
          message:"This bank statement has already been uploaded.",
        });
      }

     //if transactions were deleted -> remove stale history
      await UploadHistory.deleteOne({
        _id: existingUpload._id,
      });
    }

    const validDates = transactions
        .map((transaction) => new Date(transaction.date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);

    const periodStart = validDates.length? validDates[0]: null;

    const periodEnd = validDates.length ? validDates[validDates.length - 1]: null;


    //create  new uploadHistory
    const uploadHistory = await UploadHistory.create({
      user: req.user._id,
      contentHash,
      transactionCount: transactions.length,
      periodStart,
      periodEnd,
      originalFileName: req.file?.originalname || null,
    });

    //add the authenticated user id  and upload id to every transaction
    const transactionsWithUser = data.transactions.map(
      (transaction) => ({
        ...transaction,
        user: req.user._id,
        uploadId : uploadHistory._id,
      })
    );

    // Save cleaned transactions to MongoDB
    const savedTransactions = await Transaction.insertMany(transactionsWithUser);

    //create an upload notification
    await Notification.create({
      user: req.user._id,
      type: "upload",
      title: "Statement uploaded",
      message: `${savedTransactions.length} transactions were imported successfully.`,
      link: "/transactions",
    });
    
    const anomalyCount = savedTransactions.filter
    ((transaction) =>transaction.isAnomaly === true)
    .length;


    //if anomaly detected create notification
    if (anomalyCount > 0) {
      await Notification.create({
        user: req.user._id,
        type: "anomaly",
        title: "Unusual spending detected",
        message: `${anomalyCount} unusual transaction${
          anomalyCount > 1 ? "s" : ""
        } detected in your latest upload.`,
        link: "/anomalies",
      });
    }

    //return success
    return res.status(201).json({
      success: true,
      count: transactions.length,
      message: "Transactions uploaded successfully",
    });
    

  } catch (error) {
      console.error("CSV processing error:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
  } finally {    //handles all csv cleanup in all cases

      if (req.file?.path) {

        try {
          await fs.promises.unlink(req.file.path); //delete temporary csv
        } 
        catch (cleanupError) {

          //ENOENT means the file is already gone
          if(cleanupError.code !== "ENOENT"){
            console.error("Temporary file cleanup failed:",cleanupError);
          }
        }
      }
  }
});


export default router;