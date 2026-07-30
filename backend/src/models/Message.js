import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    image: {
      dataUrl: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        enum: ["", "image/jpeg", "image/png", "image/webp", "image/gif"],
        default: "",
      },
      name: {
        type: String,
        maxlength: 255,
        default: "",
      },
      size: {
        type: Number,
        min: 0,
        max: 3 * 1024 * 1024,
        default: 0,
      },
    },
    attachment: {
      dataUrl: { type: String, default: "" },
      mimeType: {
        type: String,
        enum: [
          "",
          "image/jpeg", "image/png", "image/webp", "image/gif",
          "video/mp4", "video/webm", "video/quicktime",
          "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4",
        ],
        default: "",
      },
      kind: {
        type: String,
        enum: ["", "image", "video", "audio"],
        default: "",
      },
      name: { type: String, maxlength: 255, default: "" },
      size: { type: Number, min: 0, max: 8 * 1024 * 1024, default: 0 },
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    hiddenFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    editedAt: {
      type: Date,
      default: null,
    },
    isUnsent: {
      type: Boolean,
      default: false,
    },
    forwarded: {
      type: Boolean,
      default: false,
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      emoji: { type: String, required: true, maxlength: 8 },
    }],
    deliveredTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

MessageSchema.pre("validate", function validateContent() {
  if (!this.isUnsent && !this.text && !this.image?.dataUrl && !this.attachment?.dataUrl) {
    this.invalidate("text", "A message must contain text or an attachment.");
  }
});

export default mongoose.model("Message", MessageSchema);
