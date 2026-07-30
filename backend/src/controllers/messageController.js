import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { emitToUser } from "../socket.js";

const USER_FIELDS = "username name email role status patient profilePicture";
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4",
]);
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

const participantKey = (firstId, secondId) =>
  [String(firstId), String(secondId)].sort().join(":");

const notifyOtherParticipants = (conversation, currentUserId, event, payload) => {
  conversation.participants
    .filter((id) => String(id) !== String(currentUserId))
    .forEach((id) => emitToUser(id, event, payload));
};

const isParticipant = (conversation, userId) =>
  conversation?.participants?.some((participant) =>
    String(participant?._id ?? participant) === String(userId)
  );

const patientCanAccessConversation = async (conversation, user) => {
  if (!conversation || user.role !== "Patient") return Boolean(conversation);
  const otherIds = conversation.participants
    .map((participant) => participant?._id ?? participant)
    .filter((id) => String(id) !== String(user._id));
  return !await User.exists({ _id: { $in: otherIds }, role: "Patient" });
};

const populateConversation = (query) => query
  .populate({
    path: "participants",
    select: USER_FIELDS,
    populate: { path: "patient", select: "patient_id first_name last_name" },
  })
  .populate({
    path: "lastMessage",
    select: "text image.mimeType attachment.mimeType attachment.kind sender readBy deliveredTo createdAt isUnsent editedAt forwarded reactions replyTo",
    populate: { path: "sender", select: "username name role profilePicture" },
  });

const serializeConversation = async (conversation, userId) => {
  const [unreadCount, latestVisibleMessage] = await Promise.all([
    Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
      hiddenFor: { $ne: userId },
    }),
    Message.findOne({
      conversation: conversation._id,
      hiddenFor: { $ne: userId },
    })
      .select("text image.mimeType attachment.mimeType attachment.kind sender readBy deliveredTo createdAt isUnsent editedAt forwarded reactions replyTo")
      .populate("sender", "username name role profilePicture")
      .sort({ createdAt: -1 }),
  ]);

  return {
    ...conversation.toObject(),
    lastMessage: latestVisibleMessage,
    lastMessageAt: latestVisibleMessage?.createdAt ?? conversation.createdAt,
    unreadCount,
    muted: conversation.mutedFor?.some((id) => String(id) === String(userId)),
    pinned: conversation.pinnedFor?.some((id) => String(id) === String(userId)),
    archived: conversation.archivedFor?.some((id) => String(id) === String(userId)),
  };
};

export const getMessageContacts = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      status: { $ne: "Inactive" },
      ...(req.user.role === "Patient" ? { role: { $ne: "Patient" } } : {}),
    })
      .select(USER_FIELDS)
      .populate("patient", "patient_id first_name last_name")
      .sort({ role: 1, username: 1 });

    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load contacts." });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await populateConversation(
      Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 })
    );
    const visibleConversations = req.user.role === "Patient"
      ? conversations.filter((conversation) =>
          conversation.participants.every((participant) =>
            String(participant._id) === String(req.user._id) || participant.role !== "Patient"
          )
        )
      : conversations;
    const data = await Promise.all(
      visibleConversations.map((conversation) => serializeConversation(conversation, req.user._id))
    );

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load conversations." });
  }
};

export const startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!mongoose.isValidObjectId(recipientId) || String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Select a valid recipient." });
    }

    const recipient = await User.findOne({ _id: recipientId, status: { $ne: "Inactive" } });
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found." });
    }
    if (req.user.role === "Patient" && recipient.role === "Patient") {
      return res.status(403).json({ success: false, message: "Patients can only message administrators and hospital staff." });
    }

    const key = participantKey(req.user._id, recipientId);
    let conversation = await Conversation.findOne({ participantKey: key });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          participants: [req.user._id, recipientId],
          participantKey: key,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne({ participantKey: key });
      }
    }

    conversation = await populateConversation(Conversation.findById(conversation._id));
    return res.status(200).json({
      success: true,
      data: await serializeConversation(conversation, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to start conversation." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const messages = await Message.find({
      conversation: conversation._id,
      hiddenFor: { $ne: req.user._id },
    })
      .populate("sender", "username name role profilePicture")
      .populate({ path: "replyTo", select: "text sender isUnsent", populate: { path: "sender", select: "username name role profilePicture" } })
      .sort({ createdAt: 1 })
      .limit(500);

    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load messages." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const text = String(req.body.text ?? "").trim();
    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: "Message is too long." });
    }

    const inputAttachment = req.body.attachment ?? req.body.image;
    let attachment;
    if (inputAttachment?.dataUrl) {
      const match = String(inputAttachment.dataUrl).match(
        /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i
      );
      if (!match || !ALLOWED_MEDIA_TYPES.has(match[1].toLowerCase())) {
        return res.status(400).json({ success: false, message: "This image, video, or audio format is not supported." });
      }

      const size = Buffer.byteLength(match[2], "base64");
      if (size > MAX_MEDIA_BYTES) {
        return res.status(400).json({ success: false, message: "Attachments must be 8 MB or smaller." });
      }

      const mimeType = match[1].toLowerCase();
      attachment = {
        dataUrl: inputAttachment.dataUrl,
        mimeType,
        kind: mimeType.split("/")[0],
        name: String(inputAttachment.name ?? "attachment").slice(0, 255),
        size,
      };
    }

    if (!text && !attachment) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    let replyTo = null;
    if (req.body.replyTo) {
      replyTo = await Message.findOne({ _id: req.body.replyTo, conversation: conversation._id });
      if (!replyTo) {
        return res.status(400).json({ success: false, message: "The replied message is unavailable." });
      }
    }

    let message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      attachment,
      readBy: [req.user._id],
      deliveredTo: [req.user._id],
      replyTo: replyTo?._id || null,
    });
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    message = await Message.findById(message._id)
      .populate("sender", "username name role profilePicture")
      .populate({ path: "replyTo", select: "text sender isUnsent", populate: { path: "sender", select: "username name role profilePicture" } });
    notifyOtherParticipants(conversation, req.user._id, "message:new", message);

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

export const editMessage = async (req, res) => {
  try {
    const text = String(req.body.text ?? "").trim();
    if (!text || text.length > 2000) {
      return res.status(400).json({ success: false, message: "Edited text must be between 1 and 2,000 characters." });
    }

    let message = await Message.findById(req.params.messageId);
    if (!message || String(message.sender) !== String(req.user._id) || message.isUnsent) {
      return res.status(404).json({ success: false, message: "Message cannot be edited." });
    }

    const conversation = await Conversation.findById(message.conversation);
    if (!isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    message.text = text;
    message.editedAt = new Date();
    await message.save();
    message = await Message.findById(message._id).populate("sender", "username name role profilePicture");

    notifyOtherParticipants(conversation, req.user._id, "message:updated", message);
    return res.json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to edit message." });
  }
};

export const unsendMessage = async (req, res) => {
  try {
    const scope = req.body?.scope === "you" ? "you" : "everyone";
    let message = await Message.findById(req.params.messageId);
    const conversation = message && await Conversation.findById(message.conversation);
    if (!message || !isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Message cannot be unsent." });
    }

    if (scope === "you") {
      await Message.updateOne(
        { _id: message._id },
        { $addToSet: { hiddenFor: req.user._id } }
      );
      return res.json({
        success: true,
        scope,
        messageId: String(message._id),
        conversationId: String(conversation._id),
      });
    }

    if (String(message.sender) !== String(req.user._id) || message.isUnsent) {
      return res.status(403).json({ success: false, message: "Only the sender can unsend for everyone." });
    }

    message.text = "";
    message.image = undefined;
    message.attachment = undefined;
    message.isUnsent = true;
    message.editedAt = null;
    await message.save();
    message = await Message.findById(message._id).populate("sender", "username name role profilePicture");

    notifyOtherParticipants(conversation, req.user._id, "message:unsent", message);
    return res.json({ success: true, scope, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to unsend message." });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!mongoose.isValidObjectId(recipientId) || String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Select a valid recipient." });
    }

    const source = await Message.findById(req.params.messageId);
    const sourceConversation = source && await Conversation.findById(source.conversation);
    if (!source || source.isUnsent || !isParticipant(sourceConversation, req.user._id) || !await patientCanAccessConversation(sourceConversation, req.user)) {
      return res.status(404).json({ success: false, message: "Message cannot be forwarded." });
    }

    const recipient = await User.findOne({ _id: recipientId, status: { $ne: "Inactive" } });
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found." });
    }
    if (req.user.role === "Patient" && recipient.role === "Patient") {
      return res.status(403).json({ success: false, message: "Patients can only forward messages to administrators and hospital staff." });
    }

    const key = participantKey(req.user._id, recipientId);
    let targetConversation = await Conversation.findOne({ participantKey: key });
    if (!targetConversation) {
      try {
        targetConversation = await Conversation.create({
          participants: [req.user._id, recipientId],
          participantKey: key,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        targetConversation = await Conversation.findOne({ participantKey: key });
      }
    }

    let forwardedMessage = await Message.create({
      conversation: targetConversation._id,
      sender: req.user._id,
      text: source.text,
      image: source.image?.dataUrl ? source.image.toObject() : undefined,
      attachment: source.attachment?.dataUrl ? source.attachment.toObject() : undefined,
      readBy: [req.user._id],
      forwarded: true,
      forwardedFrom: source._id,
    });
    targetConversation.lastMessage = forwardedMessage._id;
    targetConversation.lastMessageAt = forwardedMessage.createdAt;
    await targetConversation.save();

    forwardedMessage = await Message.findById(forwardedMessage._id).populate("sender", "username name role profilePicture");
    notifyOtherParticipants(targetConversation, req.user._id, "message:new", forwardedMessage);

    return res.status(201).json({
      success: true,
      data: forwardedMessage,
      conversationId: targetConversation._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to forward message." });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
        hiddenFor: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    notifyOtherParticipants(conversation, req.user._id, "message:read", {
      conversationId: String(conversation._id),
      userId: String(req.user._id),
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark messages as read." });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const allowed = new Set(["👍", "❤️", "😂", "😮", "😢", "😡"]);
    const emoji = String(req.body.emoji || "");
    if (emoji && !allowed.has(emoji)) {
      return res.status(400).json({ success: false, message: "Unsupported reaction." });
    }
    let message = await Message.findById(req.params.messageId);
    const conversation = message && await Conversation.findById(message.conversation);
    if (!message || message.isUnsent || !isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    message.reactions = message.reactions.filter((item) => String(item.user) !== String(req.user._id));
    if (emoji) message.reactions.push({ user: req.user._id, emoji });
    await message.save();
    message = await Message.findById(message._id)
      .populate("sender", "username name role profilePicture")
      .populate({ path: "replyTo", select: "text sender isUnsent", populate: { path: "sender", select: "username name role profilePicture" } });
    conversation.participants.forEach((id) => emitToUser(id, "message:updated", message));
    return res.json({ success: true, data: message });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update reaction." });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) return res.json({ success: true, data: [] });
    const candidateConversations = await Conversation.find({ participants: req.user._id });
    const conversations = req.user.role === "Patient"
      ? (await Promise.all(candidateConversations.map(async (item) =>
          await patientCanAccessConversation(item, req.user) ? item : null
        ))).filter(Boolean)
      : candidateConversations;
    const messages = await Message.find({
      conversation: { $in: conversations.map((item) => item._id) },
      text: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
      hiddenFor: { $ne: req.user._id },
      isUnsent: false,
    }).populate("sender", "username name role profilePicture").sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, data: messages });
  } catch {
    return res.status(500).json({ success: false, message: "Message search failed." });
  }
};

export const updateConversationPreference = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!isParticipant(conversation, req.user._id) || !await patientCanAccessConversation(conversation, req.user)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const fields = { muted: "mutedFor", pinned: "pinnedFor", archived: "archivedFor" };
    const field = fields[req.body.preference];
    if (!field || typeof req.body.enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid conversation preference." });
    }
    const update = req.body.enabled ? { $addToSet: { [field]: req.user._id } } : { $pull: { [field]: req.user._id } };
    await Conversation.updateOne({ _id: conversation._id }, update);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update conversation." });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const memberIds = [...new Set((req.body.memberIds || []).map(String))]
      .filter((id) => mongoose.isValidObjectId(id) && id !== String(req.user._id));
    if (!name || memberIds.length < 2) {
      return res.status(400).json({ success: false, message: "A group needs a name and at least two other members." });
    }
    const members = await User.find({ _id: { $in: memberIds }, status: "Active" }).select("_id role");
    if (members.length !== memberIds.length) {
      return res.status(400).json({ success: false, message: "One or more group members are unavailable." });
    }
    const patientCount = members.filter((member) => member.role === "Patient").length +
      (req.user.role === "Patient" ? 1 : 0);
    if (patientCount > 1) {
      return res.status(403).json({ success: false, message: "A conversation cannot include more than one patient." });
    }
    let conversation = await Conversation.create({
      participants: [req.user._id, ...memberIds],
      participantKey: `group:${new mongoose.Types.ObjectId()}`,
      type: "group",
      name,
      admins: [req.user._id],
    });
    conversation = await populateConversation(Conversation.findById(conversation._id));
    const data = await serializeConversation(conversation, req.user._id);
    memberIds.forEach((id) => emitToUser(id, "conversation:new", data));
    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to create group." });
  }
};

