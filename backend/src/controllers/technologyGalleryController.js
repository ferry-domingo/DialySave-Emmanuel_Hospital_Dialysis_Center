import TechnologyPhoto from "../models/TechnologyPhoto.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_CATEGORIES = ["technology", "organization", "training"];

export const getTechnologyPhotos = async (req, res) => {
  try {
    const photos = await TechnologyPhoto.find().select("-dataUrl").sort({ createdAt: 1 }).lean();
    const origin = `${req.protocol}://${req.get("host")}`;
    return res.json({ success: true, data: photos.map((photo) => ({ ...photo, category: photo.category || "technology", imageUrl: `${origin}/api/technology-gallery/${photo._id}/image` })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load technology photos.", error: error.message });
  }
};

export const getTechnologyPhotoImage = async (req, res) => {
  try {
    const photo = await TechnologyPhoto.findById(req.params.id).select("mimeType dataUrl").lean();
    if (!photo?.dataUrl) return res.status(404).end();
    const separator = photo.dataUrl.indexOf(",");
    if (separator < 0) return res.status(404).end();
    res.set("Content-Type", photo.mimeType);
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(Buffer.from(photo.dataUrl.slice(separator + 1), "base64"));
  } catch {
    return res.status(404).end();
  }
};

export const createTechnologyPhoto = async (req, res) => {
  try {
    const name = String(req.body.name || "technology-photo").slice(0, 180);
    const mimeType = String(req.body.mimeType || "");
    const dataUrl = String(req.body.dataUrl || "");
    const caption = String(req.body.caption || "").trim().slice(0, 120);
    const category = ALLOWED_CATEGORIES.includes(req.body.category) ? req.body.category : "technology";
    if (!ALLOWED_TYPES.includes(mimeType) || !dataUrl.startsWith(`data:${mimeType};base64,`)) return res.status(400).json({ success: false, message: "Select a valid JPG, PNG, WebP, or GIF image." });
    if (dataUrl.length > 8_000_000) return res.status(400).json({ success: false, message: "Photo must be smaller than 6 MB." });
    if (await TechnologyPhoto.countDocuments() >= 20) return res.status(400).json({ success: false, message: "The gallery can contain up to 20 photos." });
    const photo = await TechnologyPhoto.create({ name, mimeType, dataUrl, caption, category, createdBy: req.user._id });
    return res.status(201).json({ success: true, message: "Technology photo uploaded.", data: photo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not upload technology photo.", error: error.message });
  }
};

export const deleteTechnologyPhoto = async (req, res) => {
  try {
    const photo = await TechnologyPhoto.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Technology photo not found." });
    return res.json({ success: true, message: "Technology photo deleted." });
  } catch {
    return res.status(500).json({ success: false, message: "Could not delete technology photo." });
  }
};

export const setTechnologyPhotoHomeFeature = async (req, res) => {
  try {
    const photo = await TechnologyPhoto.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Technology photo not found." });
    if (photo.category !== "technology") return res.status(400).json({ success: false, message: "Only Facilities & Technology photos can be shown on Home." });
    const showOnHome = req.body.showOnHome === true;
    if (showOnHome && !photo.showOnHome && await TechnologyPhoto.countDocuments({ showOnHome: true }) >= 5) return res.status(400).json({ success: false, message: "Choose up to 5 photos for the Home showcase." });
    photo.showOnHome = showOnHome;
    await photo.save();
    return res.json({ success: true, message: showOnHome ? "Photo added to the Home showcase." : "Photo removed from the Home showcase.", data: photo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not update Home showcase selection.", error: error.message });
  }
};

export const updateTechnologyPhoto = async (req, res) => {
  try {
    const photo = await TechnologyPhoto.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Technology photo not found." });
    const category = ALLOWED_CATEGORIES.includes(req.body.category) ? req.body.category : photo.category;
    photo.name = String(req.body.name || photo.name).trim().slice(0, 180);
    photo.caption = String(req.body.caption || "").trim().slice(0, 120);
    photo.category = category;
    if (category !== "technology") photo.showOnHome = false;
    await photo.save();
    return res.json({ success: true, message: "Gallery photo updated.", data: photo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not update gallery photo.", error: error.message });
  }
};
