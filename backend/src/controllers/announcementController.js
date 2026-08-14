import Announcement from "../models/Announcement.js";
import { recordActivity } from "../utils/activityLog.js";
import { normalizeRole, ROLES } from "../utils/roles.js";

const VALID_ROLES = [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER, ROLES.PATIENT, ROLES.DOCTOR];
const VALID_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const populate = (query) => query.populate("createdBy", "name username");

const mediaFrom = (value) => (Array.isArray(value) ? value : []).slice(0, 4).map((item) => ({
  kind: String(item.kind || ""),
  mimeType: String(item.mimeType || ""),
  name: String(item.name || "attachment").slice(0, 180),
  dataUrl: String(item.dataUrl || ""),
}));

const valuesFrom = (body) => ({
  title: String(body.title || "").trim(),
  message: String(body.message || "").trim(),
  media: mediaFrom(body.media),
  audience: [...new Set(Array.isArray(body.audience) ? body.audience.filter((role) => VALID_ROLES.includes(role)) : [])],
  priority: "Normal",
  startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
  expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  isActive: body.isActive !== false,
});

const validate = (values) => {
  if (!values.title || !values.message) return "Title and message are required.";
  if (!values.audience.length) return "Select at least one audience role.";
  if (values.media.some((item) => item.kind !== "image" || !VALID_MEDIA_TYPES.includes(item.mimeType) || !item.dataUrl.startsWith(`data:${item.mimeType};base64,`))) return "One or more images are invalid or unsupported.";
  if (values.media.reduce((total, item) => total + item.dataUrl.length, 0) > 11_000_000) return "Combined media must be smaller than 8 MB.";
  if (Number.isNaN(values.startsAt.getTime()) || (values.expiresAt && Number.isNaN(values.expiresAt.getTime()))) return "Choose valid schedule dates.";
  if (values.expiresAt && values.expiresAt <= values.startsAt) return "Expiry must be after the start date.";
  return null;
};

export const getAnnouncements = async (req, res) => {
  try {
    const isAdmin = normalizeRole(req.user.role) === ROLES.ADMIN;
    const now = new Date();
    const filter = isAdmin ? {} : {
      isActive: true,
      audience: normalizeRole(req.user.role),
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
    const announcements = await populate(Announcement.find(filter).sort({ createdAt: -1 }));
    return res.json({ success: true, total: announcements.length, data: announcements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve announcements.", error: error.message });
  }
};

export const getPublicAnnouncements = async (_req, res) => {
  try {
    const now = new Date();
    const announcements = await populate(Announcement.find({
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 }));
    return res.json({ success: true, total: announcements.length, data: announcements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve announcements.", error: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const values = valuesFrom(req.body);
    const error = validate(values);
    if (error) return res.status(400).json({ success: false, message: error });
    let announcement = await Announcement.create({ ...values, createdBy: req.user._id });
    announcement = await populate(Announcement.findById(announcement._id));
    await recordActivity({ req, actor: req.user, action: "ANNOUNCEMENT_CREATED", details: `Published announcement: ${announcement.title}.` });
    return res.status(201).json({ success: true, message: "Announcement published.", data: announcement });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to publish announcement.", error: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const values = valuesFrom(req.body);
    const error = validate(values);
    if (error) return res.status(400).json({ success: false, message: error });
    const announcement = await populate(Announcement.findByIdAndUpdate(req.params.id, values, { new: true, runValidators: true }));
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    await recordActivity({ req, actor: req.user, action: "ANNOUNCEMENT_UPDATED", details: `Updated announcement: ${announcement.title}.` });
    return res.json({ success: true, message: "Announcement updated.", data: announcement });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update announcement.", error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    await recordActivity({ req, actor: req.user, action: "ANNOUNCEMENT_DELETED", details: `Deleted announcement: ${announcement.title}.` });
    return res.json({ success: true, message: "Announcement deleted." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete announcement." });
  }
};
