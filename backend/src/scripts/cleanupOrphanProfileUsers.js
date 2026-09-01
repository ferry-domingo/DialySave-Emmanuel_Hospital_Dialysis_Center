import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";

const execute = process.argv.includes("--execute");

try {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({ role: { $in: ["Patient", "Doctor"] } })
    .select("_id username role patient doctor")
    .lean();
  const [patients, doctors] = await Promise.all([
    Patient.find().select("_id patient_id").lean(),
    Doctor.find().select("_id doctor_id").lean(),
  ]);

  const patientIds = new Set(patients.map(({ _id }) => String(_id)));
  const patientLoginIds = new Set(patients.map(({ patient_id }) => patient_id).filter(Boolean));
  const doctorIds = new Set(doctors.map(({ _id }) => String(_id)));
  const doctorLoginIds = new Set(doctors.map(({ doctor_id }) => doctor_id).filter(Boolean));

  const orphanUsers = users.filter((user) => {
    if (user.role === "Patient") {
      return !patientIds.has(String(user.patient || "")) && !patientLoginIds.has(user.username);
    }
    return !doctorIds.has(String(user.doctor || "")) && !doctorLoginIds.has(user.username);
  });

  console.log(JSON.stringify({
    mode: execute ? "execute" : "dry-run",
    count: orphanUsers.length,
    users: orphanUsers.map(({ _id, username, role }) => ({ _id, username, role })),
  }, null, 2));

  if (execute && orphanUsers.length) {
    const result = await User.deleteMany({ _id: { $in: orphanUsers.map(({ _id }) => _id) } });
    console.log(`Deleted ${result.deletedCount} orphan user account(s).`);
  }
} finally {
  await mongoose.disconnect();
}
