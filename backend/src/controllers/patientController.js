import { Patient } from "../models/Patient.js";
import { formatPatientId, generatePatientId } from "../utils/generatePatientId.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateTemporaryPassword } from "../utils/auth.js";
import { buildPatientLookupFilter } from "../utils/patientLookup.js";

const patientIdFromParts = (year, number) => {
  if (!/^\d{4}$/.test(String(year || "")) || !/^\d+$/.test(String(number || ""))) return null;
  return formatPatientId(String(year), String(number));
};

// CREATE PATIENT
export const createPatient = async (req, res) => {
  try {
    const {
      patient_id_year,
      patient_id_number,
      doctor,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      blood_type,
      contact_number,
      status,
      info_relayed,
    } = req.body;

    const hasManualId = patient_id_year !== undefined || patient_id_number !== undefined;
    const generatedPatientId = hasManualId
      ? patientIdFromParts(patient_id_year, patient_id_number)
      : await generatePatientId();
    if (!generatedPatientId) {
      return res.status(400).json({ success: false, message: "Patient ID year must have 4 digits and number must contain digits only." });
    }
    if (await Patient.exists({ patient_id: generatedPatientId }) || await User.exists({ username: generatedPatientId })) {
      return res.status(409).json({ success: false, message: "Patient ID already exists." });
    }

    if (
      !first_name ||
      !last_name ||
      !birthdate ||
      !gender ||
      !blood_type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, birthdate, sex, and blood type are required.",
      });
    }

    const patient = await Patient.create({
      patient_id: generatedPatientId,
      doctor,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      blood_type,
      contact_number,
      status,
      info_relayed,
    });

    const temporaryPassword = generateTemporaryPassword(
      patient.last_name,
      patient.birthdate
    );

    const hashedPassword =
      await bcrypt.hash(
        temporaryPassword,
        10
      );
    
    await User.create({

      username: patient.patient_id,

      name: [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" "),

      password: hashedPassword,

      role: "Patient",

      patient: patient._id,

    });

    const populatedPatient = await Patient.findById(patient._id).populate("doctor");
    
    return res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      data: populatedPatient,
      credentials: {
        loginId: patient.patient_id,
        temporaryPassword,
      },
    });
  } catch (error) {
    console.error("Create Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create patient.",
      error: error.message,
    });
  }
};

// GET ALL PATIENTS
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("doctor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Get Patients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patients.",
      error: error.message,
    });
  }
};

// GET PATIENT BY ID
export const getPatientById = async (req, res) => {
  try {
    const filter = buildPatientLookupFilter(req.params.id);
    const patient = await Patient.findOne(filter).populate("doctor");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Get Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient.",
      error: error.message,
    });
  }
};

// UPDATE PATIENT
export const updatePatient = async (req, res) => {
  try {
    const filter = buildPatientLookupFilter(req.params.id);
    const patient = await Patient.findOne(filter);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const {
      patient_id_year,
      patient_id_number,
      doctor,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      blood_type,
      contact_number,
      status,
      info_relayed,
    } = req.body;

    if (patient_id_year !== undefined || patient_id_number !== undefined) {
      const updatedPatientId = patientIdFromParts(patient_id_year, patient_id_number);
      if (!updatedPatientId) {
        return res.status(400).json({ success: false, message: "Patient ID year must have 4 digits and number must contain digits only." });
      }
      const duplicatePatient = await Patient.exists({ patient_id: updatedPatientId, _id: { $ne: patient._id } });
      const duplicateUser = await User.exists({ username: updatedPatientId, patient: { $ne: patient._id } });
      if (duplicatePatient || duplicateUser) {
        return res.status(409).json({ success: false, message: "Patient ID already exists." });
      }
      patient.patient_id = updatedPatientId;
    }

    patient.doctor = doctor ?? patient.doctor;
    patient.first_name = first_name ?? patient.first_name;
    patient.last_name = last_name ?? patient.last_name;
    patient.middle_name = middle_name ?? patient.middle_name;
    patient.birthdate = birthdate ?? patient.birthdate;
    patient.gender = gender ?? patient.gender;
    patient.blood_type = blood_type ?? patient.blood_type;
    patient.status = status ?? patient.status;
    patient.contact_number = contact_number ?? patient.contact_number;
    patient.info_relayed = info_relayed ?? patient.info_relayed;
    
    await patient.save();

    if (patient_id_year !== undefined || patient_id_number !== undefined) {
      await User.updateOne({ patient: patient._id, role: "Patient" }, { username: patient.patient_id });
    }

    const updatedPatient = await Patient.findById(patient._id)
      .populate("doctor");

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      data: updatedPatient,
    });

  } catch (error) {
    console.error("Update Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update patient.",
      error: error.message,
    });
  }
};

// DELETE PATIENT
export const deletePatient = async (req, res) => {
  try {
    const filter = buildPatientLookupFilter(req.params.id);
    const patient = await Patient.findOne(filter);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    await User.deleteMany({
      role: "Patient",
      $or: [
        { patient: patient._id },
        { username: patient.patient_id },
      ],
    });
    await patient.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete patient.",
      error: error.message,
    });
  }
};
