import { Request, Response } from "express";
import multer from "multer";
import { PinataSDK } from "pinata";
import AppError from "../utils/AppError";

////////////////////////////////////
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

/////////////////////////
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

//////////////////////////////////////////
// Future function to retrieve file from IPFS using CID

export async function getFileFromIPFS(req: Request, res: Response, next: any) {
  try {
    const { cid } = req.params;
    if (!cid)
      return next(
        new AppError("No CID: Please Enter the file's IPFS hash.", 400),
      );

    const data = await pinata.gateways.public.get(`${cid}`);
    res.json({
      message: "File retrieved successfully from IPFS",
      data,
    });
    console.log(data);

    // // Ensure cid is a string (req.params can be string | string[])
    // const cidString = Array.isArray(cid) ? cid[0] : cid;

    // const response = await pinata.gateways.public.get(cidString);

    // // Pinata returns { data: Blob, contentType: string }
    // // Convert Blob to Buffer and send as file
    // const buffer = Buffer.from(await response.data.arrayBuffer());

    // res.setHeader("Content-Type", response.contentType || "application/pdf");
    // res.setHeader("Content-Disposition", `inline; filename="${cidString}.pdf"`);
    // res.send(buffer);
  } catch (error: any) {
    console.error("Error retrieving file from IPFS:", error);
    next(new AppError(error.message, 500));
  }
}
