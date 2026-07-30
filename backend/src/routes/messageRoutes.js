import express from "express";
import {
  getConversations,
  getMessageContacts,
  getMessages,
  editMessage,
  forwardMessage,
  markConversationRead,
  sendMessage,
  startConversation,
  unsendMessage,
  createGroupConversation,
  reactToMessage,
  searchMessages,
  updateConversationPreference,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/contacts", getMessageContacts);
router.get("/conversations", getConversations);
router.post("/conversations", startConversation);
router.post("/conversations/group", createGroupConversation);
router.get("/search", searchMessages);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.patch("/conversations/:conversationId/read", markConversationRead);
router.patch("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", unsendMessage);
router.post("/messages/:messageId/unsend", unsendMessage);
router.post("/messages/:messageId/forward", forwardMessage);
router.patch("/messages/:messageId/reaction", reactToMessage);
router.patch("/conversations/:conversationId/preferences", updateConversationPreference);

export default router;
