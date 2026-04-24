import dotenv from "dotenv";

// Load environment variables first, before any other imports
dotenv.config({ path: "../.env" });

import express from "express";
import cors from "cors";
import morgan from "morgan";

import fileRoute from "./Route/fileRoute";
import globalErrorHandler from "./controller/globalErrorHandler";
import AppError from "./utils/AppError";

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Routes
app.use("/api/v1/files", fileRoute);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
