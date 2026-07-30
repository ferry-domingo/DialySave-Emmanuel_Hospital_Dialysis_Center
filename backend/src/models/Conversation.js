import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    name: { type: String, trim: true, maxlength: 80, default: "" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    archivedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pinnedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
