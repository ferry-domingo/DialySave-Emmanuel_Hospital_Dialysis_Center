import { Doctor } from "../models/Doctor.js";
import User from "../models/User.js";
import { Patient } from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";
import { generateTemporaryPassword, hashPassword } from "../utils/auth.js";
import { generateDoctorId } from "../utils/generateDoctorId.js";

// CREATE DOCTOR
export const createDoctor = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      contact_number,
      status,
    } = req.body;
    if (!first_name || !last_name || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, birthdate, and gender are required.",
      });
    }

    let doctor;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        doctor = await Doctor.create({
          doctor_id: await generateDoctorId(),
          first_name,
          last_name,
          middle_name,
          birthdate,
          gender,
          contact_number,
          status,
        });
        break;
      } catch (error) {
        if (error?.code !== 11000 || attempt === 4) throw error;
      }
    }

    const initialPassword = generateTemporaryPassword(doctor.last_name, doctor.birthdate);

    try {
      await User.create({
        username: doctor.doctor_id,
        name: [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" "),
        password: await hashPassword(initialPassword),
        role: "Doctor",
        doctor: doctor._id,
        status: doctor.status,
      });
    } catch (accountError) {
      await doctor.deleteOne();
      throw accountError;
    }

    return res.status(201).json({
      success: true,
      message: `Doctor created successfully with ID ${doctor.doctor_id}.`,
      data: doctor,
      credentials: {
        loginId: doctor.doctor_id,
        initialPassword,
      },
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
      first_name,
      last_name,
      middle_name,
      birthdate,
      gender,
      contact_number,
      status,
    } = req.body;
    const credentialsChanged =
      (last_name !== undefined && last_name !== doctor.last_name) ||
      (birthdate !== undefined && new Date(birthdate).getTime() !== new Date(doctor.birthdate).getTime());

    doctor.first_name = first_name ?? doctor.first_name;
    doctor.last_name = last_name ?? doctor.last_name;
    doctor.middle_name = middle_name ?? doctor.middle_name;
    doctor.birthdate = birthdate ?? doctor.birthdate;
    doctor.gender = gender ?? doctor.gender;
    doctor.contact_number = contact_number ?? doctor.contact_number;
    doctor.status = status ?? doctor.status;

    await doctor.save();

    const doctorUser = await User.findOne({ doctor: doctor._id });
    if (doctorUser) {
      doctorUser.username = doctor.doctor_id;
      doctorUser.name = [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" ");
      doctorUser.status = doctor.status;
      if (credentialsChanged) {
        doctorUser.password = await hashPassword(generateTemporaryPassword(doctor.last_name, doctor.birthdate));
      }
      await doctorUser.save();
    } else {
      await User.create({
        username: doctor.doctor_id,
        name: [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" "),
        password: await hashPassword(generateTemporaryPassword(doctor.last_name, doctor.birthdate)),
        role: "Doctor",
        doctor: doctor._id,
        status: doctor.status,
      });
    }

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

    await User.deleteOne({ doctor: doctor._id });
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

// GET THE SIGNED-IN DOCTOR'S ASSIGNED PATIENTS AND SESSIONS
export const getMyDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user?.doctor?._id || req.user?.doctor;
    if (!doctorId) {
      return res.status(403).json({ success: false, message: "This account is not linked to a doctor profile." });
    }

    const [doctor, patients] = await Promise.all([
      Doctor.findById(doctorId),
      Patient.find({ doctor: doctorId }).sort({ last_name: 1, first_name: 1 }),
    ]);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    // A doctor needs the complete treatment history of every patient currently
    // assigned to them, including older sessions recorded under another doctor.
    const patientIds = patients.map((patient) => patient._id);
    const sessionScope = patientIds.length
      ? { $or: [{ doctor: doctorId }, { patient: { $in: patientIds } }] }
      : { doctor: doctorId };
    const sessions = await DialysisSession.find(sessionScope)
      .populate("patient", "patient_id first_name middle_name last_name birthdate gender blood_type contact_number status")
      .populate("doctor", "doctor_id first_name middle_name last_name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        doctor,
        patients,
        sessions,
        summary: {
          patientCount: patients.length,
          sessionCount: sessions.length,
          sessionsThisMonth: sessions.filter((session) => {
            const date = new Date(session.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load doctor dashboard.", error: error.message });
  }
};
