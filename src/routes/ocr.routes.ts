import { Router } from "express";
import multer from "multer";
import { ocrFromUpload } from "../controllers/ocr.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok =
      /^image\/(jpeg|png|webp|gif|bmp|tiff)$/i.test(file.mimetype) ||
      /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error("Only image uploads are allowed"));
  },
});

const router = Router();

router.post(
  "/",
  optionalAuth,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Upload error" });
        return;
      }
      next();
    });
  },
  (req, res, next) => {
    ocrFromUpload(req, res).catch(next);
  },
);

export default router;
