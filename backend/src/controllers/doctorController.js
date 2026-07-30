import { Doctor } from "../models/Doctor.js";

// CREATE DOCTOR
export const createDoctor = async (req, res) => {
  try {
    const {
      doctor_id,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      contact_number,
      status,
    } = req.body;

    if (!doctor_id || !first_name || !last_name || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        message:
          "Doctor ID, first name, last name, birthdate, and gender are required.",
      });
    }

    const existingDoctor = await Doctor.findOne({ doctor_id });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Doctor ID already exists.",
      });
    }

    const doctor = await Doctor.create({
      doctor_id,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      contact_number,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully.",
      data: doctor,
    });
  } catch (error) {
    console.error("Create Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor.",
      error: error.message,
    });
  }
};

// GET ALL DOCTORS
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Get Doctors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctors.",
      error: error.message,
    });
  }
};

// GET DOCTOR BY ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Get Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctor.",
      error: error.message,
    });
  }
};

// UPDATE DOCTOR
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const {
      doctor_id,
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      contact_number,
      status,
    } = req.body;

    if (doctor_id && doctor_id !== doctor.doctor_id) {
      const existingDoctor = await Doctor.findOne({ doctor_id });

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          message: "Doctor ID already exists.",
        });
      }

      doctor.doctor_id = doctor_id;
    }

    doctor.first_name = first_name ?? doctor.first_name;
    doctor.last_name = last_name ?? doctor.last_name;
    doctor.middle_name = middle_name ?? doctor.middle_name;
    doctor.birthdate = birthdate ?? doctor.birthdate;
    doctor.gender = gender ?? doctor.gender;
    doctor.contact_number = contact_number ?? doctor.contact_number;
    doctor.status = status ?? doctor.status;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully.",
      data: doctor,
    });
  } catch (error) {
    console.error("Update Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor.",
      error: error.message,
    });
  }
};

// DELETE DOCTOR
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    await doctor.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete doctor.",
      error: error.message,
    });
  }
};