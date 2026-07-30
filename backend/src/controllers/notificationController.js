import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser } from "../socket.js";
import { recordActivity } from "../utils/activityLog.js";
import { normalizeRole, ROLES } from "../utils/roles.js";

const canManageAlerts = (user) =>
  [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER].includes(normalizeRole(user?.role));

const populateNotification = (query) => query
  .populate("patient", "patient_id first_name middle_name last_name")
  .populate("createdBy", "name username");

export const createNotification = async (req, res) => {
  try {
    const { patientId, type, title, message, scheduledFor } = req.body;
    if (!patientId || !String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "Patient and title are required." });
    }
    if (!["Dialysis Schedule", "General Alert"].includes(type)) {
      return res.status(400).json({ success: false, message: "Choose a valid alert type." });
    }
    if (type === "Dialysis Schedule" && !scheduledFor) {
      return res.status(400).json({ success: false, message: "Select the next dialysis schedule." });
    }

    if (patientId === "all") {
      const recipients = await User.find({
        role: ROLES.PATIENT,
        status: "Active",
        patient: { $ne: null },
      }).select("_id patient");

      if (recipients.length === 0) {
        return res.status(404).json({ success: false, message: "No active patient accounts were found." });
      }

      const created = await Notification.insertMany(recipients.map((recipient) => ({
        recipient: recipient._id,
        patient: recipient.patient,
        createdBy: req.user._id,
        type,
        title: String(title).trim(),
        message: String(message || "").trim(),
        scheduledFor: scheduledFor || null,
      })));

      const notifications = await populateNotification(
        Notification.find({ _id: { $in: created.map((item) => item._id) } })
      );
      const recipientByPatient = new Map(
        recipients.map((recipient) => [String(recipient.patient), recipient._id])
      );
      notifications.forEach((notification) => {
        const recipientId = recipientByPatient.get(String(notification.patient?._id || notification.patient));
        if (recipientId) emitToUser(recipientId, "notification:new", notification);
      });

      await recordActivity({
        req,
        actor: req.user,
        action: "PATIENT_ALERT_SENT",
        details: `${type} alert sent to all ${notifications.length} active patient accounts.`,
      });
      return res.status(201).json({
        success: true,
        message: `Alert sent to ${notifications.length} patients.`,
        data: notifications,
      });
    }

    const recipient = await User.findOne({ role: "Patient", patient: patientId });
    if (!recipient) return res.status(404).json({ success: false, message: "No patient account was found." });

    let notification = await Notification.create({
      recipient: recipient._id,
      patient: patientId,
      createdBy: req.user._id,
      type,
      title: String(title).trim(),
      message: String(message || "").trim(),
      scheduledFor: scheduledFor || null,
    });
    notification = await populateNotification(Notification.findById(notification._id));
    emitToUser(recipient._id, "notification:new", notification);

    await recordActivity({
      req,
      actor: req.user,
      action: "PATIENT_ALERT_SENT",
      target: recipient,
      details: `${type} alert sent to ${recipient.username}.`,
    });
    return res.status(201).json({ success: true, message: "Patient alert sent.", data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send patient alert.", error: error.message });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const { patientId, type, title, message, scheduledFor } = req.body;
    if (!patientId || !String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "Patient and title are required." });
    }
    if (!["Dialysis Schedule", "General Alert"].includes(type)) {
      return res.status(400).json({ success: false, message: "Choose a valid alert type." });
    }
    if (type === "Dialysis Schedule" && !scheduledFor) {
      return res.status(400).json({ success: false, message: "Select the next dialysis schedule." });
    }
    const recipient = await User.findOne({ role: "Patient", patient: patientId });
    if (!recipient) return res.status(404).json({ success: false, message: "No patient account was found." });

    const existing = await Notification.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Alert not found." });
    const previousRecipient = existing.recipient;
    existing.recipient = recipient._id;
    existing.patient = patientId;
    existing.type = type;
    existing.title = String(title).trim();
    existing.message = String(message || "").trim();
    existing.scheduledFor = scheduledFor || null;
    if (String(previousRecipient) !== String(recipient._id)) {
      existing.isRead = false;
      existing.readAt = null;
    }
    await existing.save();
    const notification = await populateNotification(Notification.findById(existing._id));
    emitToUser(previousRecipient, "notification:changed", { id: existing._id });
    emitToUser(recipient._id, "notification:changed", { id: existing._id });
    return res.json({ success: true, message: "Alert updated.", data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update alert.", error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: "Alert not found." });
    emitToUser(notification.recipient, "notification:changed", { id: notification._id });
    return res.json({ success: true, message: "Alert deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete alert." });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const isManager = canManageAlerts(req.user);
    const filter = isManager ? {} : { recipient: req.user._id };
    const notifications = await populateNotification(Notification.find(filter).sort({ createdAt: -1 }));
    const unread = isManager ? 0 : await Notification.countDocuments({ ...filter, isRead: false });
    return res.json({ success: true, total: notifications.length, unread, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve alerts." });
  }
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: "Alert not found." });
  return res.json({ success: true, data: notification });
};

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return res.json({ success: true, message: "All alerts marked as read." });
};
