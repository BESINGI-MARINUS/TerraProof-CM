import AppError from "../utils/AppError";

const sendErrorDev = (err: any, res: any) => {
  console.log(err);
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: any) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong!",
  });
};

export default (err: any, req: any, res: any, next: any) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.message.includes("Not a PDF"))
      err = new AppError("Not a PDF. Please upload only PDF files.", 400);

    if (err.message.includes("Failed to upload file to IPFS"))
      err = new AppError("Failed to upload file to IPFS", 500);

    if (err.message.includes("No file uploaded."))
      err = new AppError(
        "No file uploaded. Please upload a scanned Land Title PDF files.",
        400,
      );

    sendErrorProd(err, res);
  }
};
