import express from "express";
import * as fileController from "../controller/fileController";

const router = express.Router();

router
  .route("/")
  .post(fileController.uploadLandTitlePdf, fileController.uploadToIPFS);

router.get("/:cid", fileController.getFileFromIPFS);

export default router;
