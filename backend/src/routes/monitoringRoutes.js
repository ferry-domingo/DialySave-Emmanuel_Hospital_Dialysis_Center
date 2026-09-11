import express from "express";
import multer from "multer";
import { getDoctorAgreementBulk, getPatientMonitoring, importPackage, previewPackageImport } from "../controllers/monitoringController.js";
import { protect, roleOnly } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = express.Router();
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!/\.(xlsx|xls)$/i.test(file.originalname || "")) return callback(new Error("Only .xlsx and .xls files are supported."));
    return callback(null, true);
  },
});

router.post("/:id/package-import/preview", protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), excelUpload.single("file"), previewPackageImport);
router.post("/:id/package-import", protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), excelUpload.single("file"), importPackage);
router.get("/agreement-bulk", protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getDoctorAgreementBulk);
router.get("/:id", protect, roleOnly(ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER), getPatientMonitoring);

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, message: "Excel file must be 5 MB or smaller." });
  return res.status(400).json({ success: false, message: error.message || "Unable to upload the Excel file." });
});

export default router;
