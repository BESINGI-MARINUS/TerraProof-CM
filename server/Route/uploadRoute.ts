import express from "express";
import * as uploadController from "../controller/uploadController";

const router = express.Router();

router.post("/", uploadController.uploadToIPFS);

export default router;
