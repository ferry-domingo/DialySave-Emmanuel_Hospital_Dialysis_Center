import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import DialysisSession from "../models/DialysisSession.js";

dotenv.config();

const migrateLaboratoryRequest = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
    await connectDB();

    const renamed = await DialysisSession.collection.updateMany(
      { laboratory_results: { $exists: true }, laboratory_request: { $exists: false } },
      { $rename: { laboratory_results: "laboratory_request" } }
    );

    const cleaned = await DialysisSession.collection.updateMany(
      { laboratory_results: { $exists: true }, laboratory_request: { $exists: true } },
      { $unset: { laboratory_results: "" } }
    );

    console.log(`Migrated ${renamed.modifiedCount} dialysis session record(s).`);
    console.log(`Removed ${cleaned.modifiedCount} duplicate legacy field(s).`);
  } catch (error) {
    console.error("Laboratory request migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateLaboratoryRequest();
