import { Router } from "express";
import { uploadFile, getMyFiles, downloadFile, deleteFile } from "../controllers/file.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/upload", auth, upload.single("file"), uploadFile);
router.get("/my", auth, getMyFiles);
router.get("/:id", auth, downloadFile);
router.delete("/:id", auth, deleteFile);

export default router;
