import { Request, Response } from "express";

export async function uploadToIPFS(req: Request, res: Response) {
  try {
    res.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
}
