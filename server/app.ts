import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import uploadRoute from "./Route/uploadRoute";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/v1/upload", uploadRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
