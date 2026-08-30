import test from "node:test";
import assert from "node:assert/strict";
import XLSX from "xlsx";

import { validatePackageWorkbook } from "../controllers/monitoringController.js";

const HEADERS = [
  "Session Date", "Epoetin", "Iron", "Dialyzer", "CBC", "CREA", "BUN",
  "HEPA PROFILE", "ALKALINE", "POTASSIUM", "PHOSPHORUS", "CALCIUM",
  "SODIUM", "ALBUMIN", "SERUM IRON/FERRITIN",
];

const workbookBuffer = (rows) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([HEADERS, ...rows]), "Package Import");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

test("normalizes a valid historical package row", () => {
  const result = validatePackageWorkbook(workbookBuffer([
    ["2025-01-05", "Eposino", "Yes", "Low Flux", "X", "", "", "", "", "", "", "", "", "", "✓"],
  ]));
  assert.equal(result.errors.length, 0);
  assert.equal(result.year, 2025);
  assert.equal(result.rows[0].iron, true);
  assert.equal(result.rows[0].dialyzer, "Low Flux");
  assert.deepEqual(result.rows[0].laboratory_results.filter((lab) => lab.done).map((lab) => lab.name), ["CBC", "Serum Iron"]);
});

test("rejects mixed years and unsupported values", () => {
  const result = validatePackageWorkbook(workbookBuffer([
    ["2024-12-30", "Unknown Epoetin", "maybe", "Medium Flux"],
    ["2024-12-31", "", "", ""],
    ["2025-01-02", "", "", ""],
  ]));
  assert.equal(result.year, null);
  assert.ok(result.errors.some((entry) => entry.rowNumber === 2));
  assert.ok(result.errors.some((entry) => entry.rowNumber === null && entry.errors[0].includes("same calendar year")));
});

test("requires the fixed template headers", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Session Date"]]), "Package Import");
  assert.throws(() => validatePackageWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })), /Missing required columns/);
});

test("accepts the consolidated legacy PACKAGE sheet layout", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    [],
    ["NO.:", "DATE OF SESSION", "EPOETIN", "IRON", "DIALYZER", "LABORATORY"],
    ["", "", "", "", "", "CBC", "CREA", "BUN", "HEPA PROFILE", "ALKALINE", "POTASSIUM", "PHOSPHORUS", "CALCIUM", "SODIUM", "ALBUMIN", "Serum Iron / Ferritin "],
    [1, "August 30, 2025", "PRE-FILLED", "✓", "✓", "✓"],
  ]), "PACKAGE");
  const result = validatePackageWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  assert.equal(result.errors.length, 0);
  assert.equal(result.year, 2025);
  assert.equal(result.rows[0].epoetin, "Pre-filled");
  assert.equal(result.rows[0].dialyzer, "High Flux");
  assert.equal(result.rows[0].laboratory_results[0].done, true);
});
