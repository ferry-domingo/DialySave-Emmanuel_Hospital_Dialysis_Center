import SiteContact from "../models/SiteContact.js";

const publicFields = (contact) => ({
  email: contact?.email || "",
  phone: contact?.phone || "",
});

export const getSiteContact = async (_req, res) => {
  try {
    const contact = await SiteContact.findOne({ key: "public-contact" }).lean();
    return res.json({ success: true, data: publicFields(contact) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load contact information.", error: error.message });
  }
};

export const updateSiteContact = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Enter a valid support email address." });
    if (!/^[+()\d][+()\d\s.-]{6,39}$/.test(phone)) return res.status(400).json({ success: false, message: "Enter a valid contact number." });

    const contact = await SiteContact.findOneAndUpdate(
      { key: "public-contact" },
      { $set: { email, phone, updatedBy: req.user._id }, $setOnInsert: { key: "public-contact" } },
      { new: true, upsert: true, runValidators: true },
    );
    return res.json({ success: true, message: "Public contact information updated.", data: publicFields(contact) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not update contact information.", error: error.message });
  }
};
