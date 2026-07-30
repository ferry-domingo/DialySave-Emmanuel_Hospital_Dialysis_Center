import DialysisSession from "../models/DialysisSession.js";

export const generateSessionId = async () => {
  const year = new Date().getFullYear();

  // Hanapin ang latest session ngayong taon
  const latestSession = await DialysisSession.findOne({
    session_id: new RegExp(`^SES-${year}-`)
  }).sort({ createdAt: -1 });

  let nextNumber = 1;

  if (latestSession) {
    const lastNumber = parseInt(
      latestSession.session_id.split("-")[2],
      10
    );

    nextNumber = lastNumber + 1;
  }

  return `SES-${year}-${String(nextNumber).padStart(4, "0")}`;
};