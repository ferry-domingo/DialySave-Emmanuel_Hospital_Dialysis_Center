import mongoose from "mongoose";

export const buildPatientLookupFilter = (identifier) => {
  if (!identifier) {
    return {};
  }

  if (mongoose.isValidObjectId(identifier)) {
    return { _id: identifier };
  }

  return { patient_id: identifier };
};
