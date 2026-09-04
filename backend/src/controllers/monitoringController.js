import { randomUUID } from "node:crypto";
import XLSX from "xlsx";

import DialysisSession from "../models/DialysisSession.js";
import { Patient } from "../models/Patient.js";

const PHIC_LIMIT = 156;
const STANDARD_IRON = "Iron Sucrose 20 mg/mL, 5mL ampule";
const LAB_COLUMNS = ["CBC", "CREA", "BUN", "HEPA PROFILE", "ALKALINE", "POTASSIUM", "PHOSPHORUS", "CALCIUM", "SODIUM", "ALBUMIN", "SERUM IRON/FERRITIN"];
const REQUIRED_COLUMNS = ["SESSION DATE", "EPOETIN", "IRON", "DIALYZER", ...LAB_COLUMNS];
const EPOETIN_OPTIONS = new Set([
  "2000 IU / 0.5 mL pre-filled syringe", "4000 IU / 0.4 mL pre-filled syringe",
  "4000 IU / mL, 1mL vial", "4000 IU / mL solution for injection in 1mL pre-filled syringe",
  "10000 IU / mL pre-filled syringe", "2000 IU / 0.3 mL pre-filled syringe",
  "5000 IU / 0.3 mL pre-filled syringe", "10000 IU / 0.6 mL pre-filled syringe",
  "Eposino", "Flu-vaccine",
]);
const DIALYZER_OPTIONS = new Set(["Low Flux", "High Flux"]);
const TRUE_MARKS = new Set(["YES", "Y", "1", "TRUE", "X", "✓"]);
const FALSE_MARKS = new Set(["", "NO", "N", "0", "FALSE"]);

const clean = (value) => String(value ?? "").trim();
const normalizedHeader = (value) => clean(value).toUpperCase().replace(/\s+/g, " ");
const dateKey = (date) => new Date(date).toISOString().slice(0, 10);
const yearRange = (year) => ({ $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) });

const parseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12));
  }
  if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);
    return parts ? new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12)) : null;
  }
  const text = clean(value);
  const longDate = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (longDate) {
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const month = months.indexOf(longDate[1].toUpperCase());
    const day = Number(longDate[2]);
    const year = Number(longDate[3]);
    if (month >= 0) {
      const result = new Date(Date.UTC(year, month, day, 12));
      if (result.getUTCMonth() === month && result.getUTCDate() === day) return result;
    }
  }
  let match = text.match(/^(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)$/);
  const yearFirst = Boolean(match);
  if (!match) match = text.match(/^([01]?\d)[-\/]([0-3]?\d)[-\/](\d{4})$/);
  if (!match) return null;
  const [year, month, day] = yearFirst
    ? [Number(match[1]), Number(match[2]), Number(match[3])]
    : [Number(match[3]), Number(match[1]), Number(match[2])];
  const result = new Date(Date.UTC(year, month - 1, day, 12));
  return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === day ? result : null;
};

const parseMark = (value) => {
  const normalized = clean(value).toUpperCase();
  if (TRUE_MARKS.has(normalized)) return { valid: true, checked: true };
  if (FALSE_MARKS.has(normalized)) return { valid: true, checked: false };
  return { valid: false, checked: false };
};

const readWorkbook = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const packageSheet = workbook.SheetNames.find((name) => normalizedHeader(name) === "PACKAGE");
  const sheetName = packageSheet || workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook does not contain a worksheet.");
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true });
  if (!rows.length) throw new Error("The worksheet is empty.");
  const legacyHeaderIndex = rows.findIndex((row) => row.some((cell) => normalizedHeader(cell) === "DATE OF SESSION"));
  if (legacyHeaderIndex >= 0) {
    const mainHeaders = rows[legacyHeaderIndex].map(normalizedHeader);
    const labHeaders = (rows[legacyHeaderIndex + 1] || []).map(normalizedHeader);
    const indexFor = (name) => mainHeaders.indexOf(name);
    const labIndexFor = (name) => {
      const aliases = name === "SERUM IRON/FERRITIN" ? [name, "SERUM IRON / FERRITIN"] : [name];
      return labHeaders.findIndex((header) => aliases.includes(header));
    };
    const missingMain = ["DATE OF SESSION", "EPOETIN", "IRON", "DIALYZER"].filter((column) => indexFor(column) < 0);
    const missingLabs = LAB_COLUMNS.filter((column) => labIndexFor(column) < 0);
    if (missingMain.length || missingLabs.length) throw new Error(`The PACKAGE sheet is missing columns: ${[...missingMain, ...missingLabs].join(", ")}.`);
    return {
      legacy: true,
      sourceRows: rows.slice(legacyHeaderIndex + 2)
        .map((cells, index) => ({ cells, rowNumber: legacyHeaderIndex + index + 3 }))
        .filter(({ cells }) => clean(cells[indexFor("DATE OF SESSION")]) !== "")
        .map(({ cells, rowNumber }) => ({
          rowNumber,
          values: {
            "SESSION DATE": cells[indexFor("DATE OF SESSION")], EPOETIN: cells[indexFor("EPOETIN")],
            IRON: cells[indexFor("IRON")], DIALYZER: cells[indexFor("DIALYZER")],
            ...Object.fromEntries(LAB_COLUMNS.map((column) => [column, cells[labIndexFor(column)]])),
          },
        })),
    };
  }
  const headers = rows[0].map(normalizedHeader);
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}.`);
  const indexes = Object.fromEntries(REQUIRED_COLUMNS.map((column) => [column, headers.indexOf(column)]));
  return { legacy: false, sourceRows: rows.slice(1)
    .map((cells, index) => ({ cells, rowNumber: index + 2 }))
    .filter(({ cells }) => cells.some((cell) => clean(cell) !== ""))
    .map(({ cells, rowNumber }) => ({ rowNumber, values: Object.fromEntries(REQUIRED_COLUMNS.map((column) => [column, cells[indexes[column]]])) })) };
};

export const validatePackageWorkbook = (buffer) => {
  const { sourceRows, legacy } = readWorkbook(buffer);
  const rows = [];
  const errors = [];
  for (const { rowNumber, values } of sourceRows) {
    const rowErrors = [];
    const date = parseDate(values["SESSION DATE"]);
    const originalEpoetin = clean(values.EPOETIN);
    const epoetinAlias = normalizedHeader(originalEpoetin);
    const epoetin = epoetinAlias === "PRE-FILLED" ? "Pre-filled" : epoetinAlias === "VIAL" ? "Vial" : epoetinAlias === "NONE" ? "" : originalEpoetin;
    const originalDialyzer = clean(values.DIALYZER);
    const legacyDialyzerMark = legacy ? parseMark(originalDialyzer) : null;
    const dialyzer = legacyDialyzerMark?.checked ? "High Flux" : originalDialyzer;
    const iron = parseMark(values.IRON);
    if (!date) rowErrors.push("Session Date must be a valid Excel date, YYYY-MM-DD, or MM/DD/YYYY.");
    if (epoetin && !EPOETIN_OPTIONS.has(epoetin) && !["Pre-filled", "Vial"].includes(epoetin)) rowErrors.push("Epoetin is not a supported option.");
    if (legacy && !legacyDialyzerMark.valid) rowErrors.push("Dialyzer contains an unsupported mark.");
    if (!legacy && dialyzer && !DIALYZER_OPTIONS.has(dialyzer)) rowErrors.push("Dialyzer must be Low Flux or High Flux.");
    if (!iron.valid) rowErrors.push("Iron contains an unsupported mark.");
    const laboratory_request = LAB_COLUMNS.map((column) => {
      const mark = parseMark(values[column]);
      if (!mark.valid) rowErrors.push(`${column} contains an unsupported mark.`);
      return { name: column === "SERUM IRON/FERRITIN" ? "Serum Iron" : column, done: mark.checked };
    });
    if (rowErrors.length) errors.push({ rowNumber, errors: [...new Set(rowErrors)] });
    else rows.push({ rowNumber, date, epoetin, dialyzer, iron: iron.checked, laboratory_request });
  }
  const years = [...new Set(rows.map((row) => row.date.getUTCFullYear()))];
  if (years.length > 1) errors.push({ rowNumber: null, errors: ["All session dates must be in the same calendar year."] });
  if (!sourceRows.length) errors.push({ rowNumber: null, errors: ["The worksheet has no data rows."] });
  return { rows, errors, year: years.length === 1 ? years[0] : null, totalRows: sourceRows.length };
};

const loadImportPreview = async (patientId, buffer) => {
  const patient = await Patient.findById(patientId).select("doctor first_name last_name");
  if (!patient) return { status: 404, error: "Patient not found." };
  if (!patient.doctor) return { status: 400, error: "Assign a doctor to this patient before importing sessions." };
  let parsed;
  try { parsed = validatePackageWorkbook(buffer); }
  catch (error) { return { status: 400, error: error.message || "Unable to read the Excel file." }; }
  const existing = parsed.year
    ? await DialysisSession.find({ patient: patientId, createdAt: yearRange(parsed.year) }).select("createdAt payment_type").lean()
    : [];
  const existingDates = new Set(existing.map((session) => dateKey(session.createdAt)));
  const seenInFile = new Set();
  const skippedDuplicates = [];
  const validRows = [];
  for (const row of parsed.rows) {
    const key = dateKey(row.date);
    if (existingDates.has(key) || seenInFile.has(key)) skippedDuplicates.push({ rowNumber: row.rowNumber, date: key });
    else { seenInFile.add(key); validRows.push(row); }
  }
  const existingPhicCount = existing.filter((session) => session.payment_type === "PHIC").length;
  const resultingPhicTotal = existingPhicCount + validRows.length;
  const errors = [...parsed.errors];
  if (resultingPhicTotal > PHIC_LIMIT) errors.push({ rowNumber: null, errors: [`Import would result in ${resultingPhicTotal} PHIC sessions, exceeding the 156-session yearly limit.`] });
  return {
    status: 200, patient, validRows,
    preview: {
      year: parsed.year, totalRows: parsed.totalRows, validCount: validRows.length,
      skippedDuplicates, errors, existingPhicCount, resultingPhicTotal,
      canImport: errors.length === 0 && validRows.length > 0,
      rows: validRows.map((row) => ({
        rowNumber: row.rowNumber, date: dateKey(row.date), epoetin: row.epoetin,
        iron: row.iron, dialyzer: row.dialyzer,
        laboratories: row.laboratory_request.filter((lab) => lab.done).map((lab) => lab.name),
      })),
    },
  };
};

const getAvailableYears = async (patientId) => {
  const values = await DialysisSession.distinct("createdAt", { patient: patientId });
  return [...new Set(values.map((value) => new Date(value).getUTCFullYear()))].sort((a, b) => b - a);
};

const buildMonitoring = async (patient, requestedYear) => {
  const availableYears = await getAvailableYears(patient._id);
  const parsedYear = Number(requestedYear);
  const activeYear = Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2200 ? parsedYear : (availableYears[0] || new Date().getFullYear());
  const allSessions = await DialysisSession.find({ patient: patient._id })
    .populate("patient", "patient_id first_name middle_name last_name").sort({ createdAt: 1 });
  const sessions = allSessions.filter((session) => {
    const sessionYear = new Date(session.createdAt).getUTCFullYear();
    return sessionYear === activeYear;
  });
  const phicSessions = [], yearlyPhicSessions = [], cashSessions = [], dialyzerSessions = [], packageSessions = [], agreementSessions = [];
  allSessions.forEach((session) => {
    if (session.payment_type === "PHIC") phicSessions.push(session.createdAt);
    if (session.dialyzer?.name?.trim()) dialyzerSessions.push({ date: session.createdAt, name: session.dialyzer.name });
    packageSessions.push({ _id: session._id, date: session.createdAt, epoetin: session.injections?.name || "", iron: session.intravenous_iron?.name || "", dialyzer: session.dialyzer?.name || "", laboratory_request: session.laboratory_request || [] });
    agreementSessions.push({
      sessionNo: agreementSessions.length + 1, sessionId: session._id, date: session.createdAt, payment_type: session.payment_type,
      patient: { _id: session.patient._id, patient_id: session.patient.patient_id, first_name: session.patient.first_name, middle_name: session.patient.middle_name, last_name: session.patient.last_name, full_name: [session.patient.first_name, session.patient.middle_name, session.patient.last_name].filter(Boolean).join(" ") },
      injection: session.injections, iron: session.intravenous_iron, dialyzer: session.dialyzer,
      laboratories: session.laboratory_request, agreement: session.agreement,
    });
  });
  sessions.forEach((session) => {
    if (session.payment_type === "PHIC") yearlyPhicSessions.push(session.createdAt);
    if (session.payment_type === "CASH") cashSessions.push({ id: session._id, date: session.createdAt, reason: session.reason || "" });
  });
  return {
    success: true, availableYears, activeYear,
    phic: { total: phicSessions.length, remaining: Math.max(0, PHIC_LIMIT - yearlyPhicSessions.length), dates: phicSessions, exceeded: yearlyPhicSessions.length >= PHIC_LIMIT, yearlyTotal: yearlyPhicSessions.length, cumulative: true },
    cash: { total: cashSessions.length, dates: cashSessions.map((s) => s.date), reasons: cashSessions.map((s) => s.reason), sessions: cashSessions },
    dialyzer: { total: dialyzerSessions.length, sessions: dialyzerSessions, cumulative: true },
    package: { total: packageSessions.length, sessions: packageSessions, cumulative: true },
    agreement: { total: agreementSessions.length, sessions: agreementSessions, cumulative: true },
  };
};

export const getPatientMonitoring = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });
    return res.json(await buildMonitoring(patient, req.query.year));
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const previewPackageImport = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Choose an Excel file to upload." });
  const result = await loadImportPreview(req.params.id, req.file.buffer);
  if (result.error) return res.status(result.status).json({ success: false, message: result.error });
  return res.json({ success: true, ...result.preview });
};

export const importPackage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Choose an Excel file to upload." });
    const result = await loadImportPreview(req.params.id, req.file.buffer);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    if (!result.preview.canImport) return res.status(400).json({ success: false, message: "The workbook has validation errors or no new sessions.", ...result.preview });
    const documents = result.validRows.map((row) => ({
      session_id: `SES-${result.preview.year}-IMP-${randomUUID()}`, patient: req.params.id,
      doctor: result.patient.doctor, payment_type: "PHIC",
      injections: row.epoetin ? { name: row.epoetin, payment_type: "PHIC" } : undefined,
      dialyzer: row.dialyzer ? { name: row.dialyzer, payment_type: "PHIC" } : undefined,
      intravenous_iron: row.iron ? { name: STANDARD_IRON, payment_type: "PHIC" } : undefined,
      laboratory_request: row.laboratory_request, createdAt: row.date, updatedAt: new Date(),
    }));
    await DialysisSession.insertMany(documents);
    const monitoring = await buildMonitoring(result.patient, result.preview.year);
    return res.status(201).json({ success: true, message: `${documents.length} historical session${documents.length === 1 ? "" : "s"} imported.`, importedCount: documents.length, skippedDuplicates: result.preview.skippedDuplicates, year: result.preview.year, monitoring });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Failed to import historical sessions." }); }
};
