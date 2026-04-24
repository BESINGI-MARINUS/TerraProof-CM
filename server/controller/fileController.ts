import { Request, Response } from "express";
import multer from "multer";
import { PinataSDK } from "pinata";
import AppError from "../utils/AppError";
// import { Blob, File } from "buffer";

// Configure multer for file uploads
const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: any, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new AppError("Not a PDF.", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadLandTitlePdf = upload.single("document");

// Upload file to Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT?.trim(),
  pinataGateway: process.env.PINATA_GATEWAY_URL?.trim(),
});

export async function uploadToIPFS(req: Request, res: Response, next: any) {
  try {
    if (!req.file) return next(new AppError("No file uploaded.", 400));

    const blob = new Blob([req.file.buffer]);
    const file = new File([blob], req.file.originalname, {
      type: req.file.mimetype,
    });

    const uploadResponse = await pinata.upload.public.file(file);

    res.json({
      message: "File uploaded successfully to IPFS",
      cid: uploadResponse.cid,
      url: `${process.env.PINATA_GATEWAY_URL}/ipfs/${uploadResponse.cid}`,
    });
  } catch (error: any) {
    console.error("Error uploading file to IPFS:", error);
    next(new AppError(error.message, 500));
  }
}
