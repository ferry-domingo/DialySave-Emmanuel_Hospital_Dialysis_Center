import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/auth.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      if (!existingAdmin.email) {
        existingAdmin.name = existingAdmin.name || "Administrator";
        existingAdmin.email = process.env.ADMIN_EMAIL || "temporary.admin@ehdc.local";
        await existingAdmin.save();
        console.log("Temporary admin email added.");
      }
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await hashPassword("admin123");

    await User.create({
      username: "admin",
      name: "Administrator",
      email: process.env.ADMIN_EMAIL || "temporary.admin@ehdc.local",
      password: hashedPassword,
      role: "Admin",
      status: "Active",
    });

    console.log("Admin seed created successfully.");
    console.log(`Email: ${process.env.ADMIN_EMAIL || "temporary.admin@ehdc.local"}`);
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Seed admin failed:", error);
    process.exit(1);
  }
};

seedAdmin();
