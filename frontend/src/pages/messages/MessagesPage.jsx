import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Forward,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Reply,
  Search,
  Send,
  Smile,
  Pin,
  BellOff,
  Archive,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { useAuthStore } from "../../store/authStore";
import { useMessageStore } from "../../store/messageStore";
import { useOnlineUsersStore } from "../../store/onlineUsersStore";
import { getSocket } from "../../lib/socket";
import UserAvatar from "../../components/common/UserAvatar";

const getUserId = (user) => String(user?._id ?? user?.id ?? "");

const displayName = (user) => {
  if (user?.patient) {
    const name = `${user.patient.first_name ?? ""} ${user.patient.last_name ?? ""}`.trim();
    if (name) return name;
  }
  return user?.name || user?.username || "Unknown user";
};

const otherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((participant) => getUserId(participant) !== currentUserId);

const conversationName = (conversation, currentUserId) =>
  conversation?.type === "group"
    ? conversation.name || "Group chat"
    : displayName(otherParticipant(conversation, currentUserId));

const timeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date);
};

const isEmojiOnly = (value) => {
  const text = String(value || "").trim();
  return Boolean(text) &&
    [...text].length <= 12 &&
    /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\s)+$/u.test(text);
};

const Avatar = ({ user, online = false, size = "h-11 w-11" }) => (
  <UserAvatar user={user} name={displayName(user)} className={`relative ${size} text-slate-600`}>
    {online && (
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
    )}
  </UserAvatar>
);

const mediaLabel = (message) => {
  const kind = message?.attachment?.kind ||
    (message?.attachment?.mimeType ? message.attachment.mimeType.split("/")[0] : "") ||
    (message?.image?.mimeType ? "image" : "");
  return kind === "image" ? "📷 Photo" : kind === "video" ? "🎬 Video" : kind === "audio" ? "🎵 Audio" : "";
};

const MessageMedia = ({ message }) => {
  const media = message.attachment?.dataUrl ? message.attachment : message.image;
  if (!media?.dataUrl) return null;
  const kind = media.kind || media.mimeType?.split("/")[0] || "image";

  if (kind === "video") {
    return (
      <video controls preload="metadata" className="max-h-80 w-full max-w-md bg-black">
        <source src={media.dataUrl} type={media.mimeType} />
        Your browser does not support video playback.
      </video>
    );
  }
  if (kind === "audio") {
    return (
      <div className="min-w-64 px-3 py-3">
        <p className="mb-2 truncate text-xs opacity-70">{media.name || "Audio file"}</p>
        <audio controls preload="metadata" className="h-10 w-full max-w-sm">
          <source src={media.dataUrl} type={media.mimeType} />
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }
  return (
    <a href={media.dataUrl} target="_blank" rel="noreferrer" aria-label="Open photo">
      <img
        src={media.dataUrl}
        alt={media.name || "Shared photo"}
        className="max-h-80 w-full max-w-sm object-cover"
      />
    </a>
  );
};

const MessagesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = getUserId(currentUser);
  const onlineUserIds = useOnlineUsersStore((state) => state.onlineUserIds);
  const {
    contacts,
    conversations,
    messagesByConversation,
    activeConversationId,
    messagesLoading,
    error,
    fetchContacts,
    fetchConversations,
    startConversation,
    selectConversation,
    sendMessage,
    editMessage,
    unsendMessage,
    forwardMessage,
    reactToMessage,
    setConversationPreference,
  } = useMessageStore();
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [sending, setSending] = useState(false);
  const [actionMessageId, setActionMessageId] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editText, setEditText] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [unsendTarget, setUnsendTarget] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const previousConversationRef = useRef("");
  const attachmentInputRef = useRef(null);
  const openedRecipientRef = useRef("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchContacts();
    fetchConversations();
  }, [fetchContacts, fetchConversations]);

  useEffect(() => {
    const recipientId = searchParams.get("user");
    if (!recipientId || openedRecipientRef.current === recipientId) return;

    openedRecipientRef.current = recipientId;
    startConversation(recipientId)
      .then(() => setSearchParams({}, { replace: true }))
      .catch(() => {
        openedRecipientRef.current = "";
      });
  }, [searchParams, setSearchParams, startConversation]);

  const activeConversation = conversations.find(
    (conversation) => conversation._id === activeConversationId
  );
  const activeUser = activeConversation?.type === "group"
    ? { username: activeConversation.name, role: `${activeConversation.participants?.length || 0} members` }
    : otherParticipant(activeConversation, currentUserId);
  const messages = messagesByConversation[activeConversationId] ?? [];
  const term = search.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => {
    const participant = otherParticipant(conversation, currentUserId);
    return (showArchived ? conversation.archived : (!conversation.archived || Boolean(term))) && (!term ||
      conversationName(conversation, currentUserId).toLowerCase().includes(term) ||
      participant?.role?.toLowerCase().includes(term) ||
      JSON.stringify(conversation).toLowerCase().includes(term));
  }).sort((first, second) =>
    Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)) ||
    new Date(second.lastMessageAt) - new Date(first.lastMessageAt)
  );
  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    if (!term) return true;
    return displayName(contact).toLowerCase().includes(term) ||
      contact.username?.toLowerCase().includes(term) ||
      contact.role?.toLowerCase().includes(term) ||
      JSON.stringify(contact).toLowerCase().includes(term);
  }), [contacts, term]);
  const forwardContacts = contacts.filter((contact) => {
    const forwardTerm = forwardSearch.trim().toLowerCase();
    return !forwardTerm ||
      displayName(contact).toLowerCase().includes(forwardTerm) ||
      contact.role?.toLowerCase().includes(forwardTerm);
  });

  useEffect(() => {
    const conversationChanged = previousConversationRef.current !== activeConversationId;
    previousConversationRef.current = activeConversationId;

    if (conversationChanged || shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: conversationChanged ? "auto" : "smooth",
        block: "end",
      });
    }
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const started = ({ conversationId, userId }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((users) => [...new Set([...users, userId])]);
      }
    };
    const stopped = ({ conversationId, userId }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((users) => users.filter((id) => id !== userId));
      }
    };
    socket.on("typing:start", started);
    socket.on("typing:stop", stopped);
    return () => {
      socket.off("typing:start", started);
      socket.off("typing:stop", stopped);
    };
  }, [activeConversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConversationId) return undefined;
    const timer = setTimeout(() => {
      socket.emit(draft.trim() ? "typing:start" : "typing:stop", { conversationId: activeConversationId });
    }, 250);
    const stopTimer = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: activeConversationId });
    }, 2500);
    return () => {
      clearTimeout(timer);
      clearTimeout(stopTimer);
    };
  }, [draft, activeConversationId]);

  const handleStartConversation = async (contact) => {
    await startConversation(contact._id);
    setNewChatOpen(false);
    setSearch("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !attachment) || sending) return;

    setDraft("");
    shouldAutoScrollRef.current = true;
    const pendingAttachment = attachment;
    setAttachment(null);
    setSending(true);
    try {
      await sendMessage({ text, attachment: pendingAttachment, replyTo: replyingTo?._id });
      setReplyingTo(null);
    } catch {
      setDraft(text);
      setAttachment(pendingAttachment);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/webm", "video/quicktime",
      "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4",
    ];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError("Choose a supported image, MP4/WebM video, or MP3/WAV/OGG audio file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAttachmentError("Attachments must be 8 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        dataUrl: reader.result,
        mimeType: file.type,
        kind: file.type.split("/")[0],
        name: file.name,
        size: file.size,
      });
      setAttachmentError("");
    };
    reader.onerror = () => setAttachmentError("This attachment could not be read.");
    reader.readAsDataURL(file);
  };

  const handleEdit = async (event, messageId) => {
    event.preventDefault();
    const text = editText.trim();
    if (!text || actionLoading) return;
    setActionLoading(true);
    try {
      await editMessage(messageId, text);
      setEditingMessageId("");
      setEditText("");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsend = async (messageId, scope) => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionMessageId("");
    try {
      await unsendMessage(messageId, scope);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForward = async (contact) => {
    if (!forwardingMessage || actionLoading) return;
    setActionLoading(true);
    try {
      await forwardMessage(forwardingMessage._id, contact._id);
      setForwardingMessage(null);
      setForwardSearch("");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-0 flex-col gap-2 overflow-hidden md:h-full">
      <Topbar title="Messages" />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl bg-white shadow-sm">
        <aside className={`messages-conversation-list ${activeConversationId ? "hidden md:flex" : "flex"} w-full min-w-0 flex-col border-r border-slate-100 md:w-80 lg:w-96`}>
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{newChatOpen ? "New message" : showArchived ? "Archived chats" : "Chats"}</h2>
                <p className="text-xs text-slate-400">
                  {newChatOpen
                    ? "Choose someone to message"
                    : showArchived
                      ? `${conversations.filter((item) => item.archived).length} archived`
                      : `${conversations.filter((item) => !item.archived).length} conversation${conversations.filter((item) => !item.archived).length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!newChatOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchived((value) => !value);
                      setSearch("");
                    }}
                    aria-label={showArchived ? "Back to chats" : "View archived chats"}
                    title={showArchived ? "Back to chats" : "Archived chats"}
                    className={`grid h-10 w-10 place-items-center rounded-full transition ${showArchived ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {showArchived ? <ArrowLeft size={18} /> : <Archive size={18} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNewChatOpen((open) => !open);
                    setSearch("");
                  }}
                  aria-label={newChatOpen ? "Close new message" : "Start new message"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800"
                >
                  {newChatOpen ? <X size={18} /> : <MessageCircle size={18} />}
                </button>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2.5">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={newChatOpen ? "Search people" : "Search chats"}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="scrollbar-hide flex-1 overflow-y-auto">
            {newChatOpen ? (
              filteredContacts.length ? filteredContacts.map((contact) => (
                <button
                  key={contact._id}
                  type="button"
                  onClick={() => handleStartConversation(contact)}
                  className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <Avatar user={contact} online={onlineUserIds.includes(contact._id)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName(contact)}</p>
                    <p className="truncate text-xs text-slate-400">{contact.role} · @{contact.username}</p>
                  </div>
                </button>
              )) : (
                <div className="px-6 py-12 text-center text-sm text-slate-400">No people found.</div>
              )
            ) : filteredConversations.length ? filteredConversations.map((conversation) => {
              const participant = otherParticipant(conversation, currentUserId);
              const unread = conversation.unreadCount ?? 0;
              return (
                <div key={conversation._id} className="relative border-b border-slate-50">
                  <button
                    type="button"
                    onClick={() => selectConversation(conversation._id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      showArchived ? "pr-16" : ""
                    } ${activeConversationId === conversation._id ? "bg-slate-50" : ""}`}
                  >
                  <Avatar user={participant} online={onlineUserIds.includes(getUserId(participant))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm text-slate-900 ${unread ? "font-extrabold" : "font-semibold"}`}>
                        {conversationName(conversation, currentUserId)}
                      </p>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                        {timeLabel(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={`truncate text-xs ${unread ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                        {conversation.lastMessage?.isUnsent ? "Message was unsent" :
                          conversation.lastMessage?.text ||
                          mediaLabel(conversation.lastMessage) ||
                          `Start a conversation with ${conversationName(conversation, currentUserId)}`}
                      </p>
                      {unread > 0 && (
                        <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                  </button>
                  {showArchived && (
                    <button
                      type="button"
                      onClick={() => setConversationPreference(conversation._id, "archived", false)}
                      title="Unarchive conversation"
                      aria-label={`Unarchive ${conversationName(conversation, currentUserId)}`}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-700"
                    >
                      <Archive size={17} />
                    </button>
                  )}
                </div>
              );
            }) : (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm font-semibold text-slate-600">No conversations yet</p>
                <button
                  type="button"
                  onClick={() => setNewChatOpen(true)}
                  className="mt-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Start a new message
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className={`${activeConversationId ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
          {activeConversation && activeUser ? (
            <>
              <header className="messages-chat-header flex h-[73px] shrink-0 items-center gap-3 border-b border-slate-100 px-4">
                <button
                  type="button"
                  onClick={() => useMessageStore.setState({ activeConversationId: null })}
                  aria-label="Back to conversations"
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden"
                >
                  <ArrowLeft size={19} />
                </button>
                <Avatar user={activeUser} online={onlineUserIds.includes(getUserId(activeUser))} size="h-10 w-10" />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900">{displayName(activeUser)}</h2>
                  <p className="text-xs text-slate-400">
                    {typingUsers.length
                      ? `${activeUser.role} · Typing…`
                      : `${activeUser.role}${onlineUserIds.includes(getUserId(activeUser)) ? " · Active now" : ""}`}
                  </p>
                </div>
                <div className="messages-chat-actions ml-auto flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setConversationPreference(activeConversation._id, "pinned", !activeConversation.pinned)} title={activeConversation.pinned ? "Unpin chat" : "Pin chat"} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 ${activeConversation.pinned ? "text-emerald-600" : "text-slate-400"}`}><Pin size={17} /></button>
                  <button type="button" onClick={() => setConversationPreference(activeConversation._id, "muted", !activeConversation.muted)} title={activeConversation.muted ? "Unmute chat" : "Mute chat"} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 ${activeConversation.muted ? "text-red-500" : "text-slate-400"}`}><BellOff size={17} /></button>
                  <button type="button" onClick={() => setConversationPreference(activeConversation._id, "archived", !activeConversation.archived)} title={activeConversation.archived ? "Restore chat" : "Archive chat"} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"><Archive size={17} /></button>
                </div>
              </header>

              <div
                ref={messagesScrollRef}
                tabIndex={0}
                role="log"
                aria-label="Conversation messages"
                onScroll={(event) => {
                  const element = event.currentTarget;
                  const distanceFromBottom =
                    element.scrollHeight - element.scrollTop - element.clientHeight;
                  shouldAutoScrollRef.current = distanceFromBottom < 100;
                }}
                className="scrollbar-hide min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-slate-50/60 px-4 py-5 outline-none"
              >
                {messagesLoading ? (
                  <p className="py-12 text-center text-sm text-slate-400">Loading messages...</p>
                ) : messages.length ? messages.map((message, index) => {
                  const own = getUserId(message.sender) === currentUserId;
                  const previous = messages[index - 1];
                  const sameSender = previous && getUserId(previous.sender) === getUserId(message.sender);
                  return (
                    <div key={message._id} className={`group/message flex items-center gap-1 ${own ? "justify-end" : "justify-start"} ${sameSender ? "mt-1" : "mt-4"}`}>
                      {own && !message.isUnsent && (
                        <div className="relative order-first">
                          <button
                            type="button"
                            onClick={() => setActionMessageId((id) => id === message._id ? "" : message._id)}
                            aria-label="Message actions"
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 opacity-100 transition hover:bg-white hover:text-slate-700 sm:opacity-0 sm:group-hover/message:opacity-100"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {actionMessageId === message._id && (
                            <div className="absolute bottom-9 right-0 z-20 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl">
                              {message.text && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(message._id);
                                    setEditText(message.text);
                                    setActionMessageId("");
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                              )}
                              <button type="button" onClick={() => { setReplyingTo(message); setActionMessageId(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Reply size={14} /> Reply</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUnsendTarget(message);
                                  setActionMessageId("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Unsend
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setForwardingMessage(message);
                                  setActionMessageId("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Forward size={14} /> Forward
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[82%] sm:max-w-[70%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                        {editingMessageId === message._id ? (
                          <form onSubmit={(event) => handleEdit(event, message._id)} className="flex w-full min-w-0 max-w-sm items-center gap-1 rounded-2xl bg-white p-1.5 shadow-md">
                            <input
                              autoFocus
                              value={editText}
                              onChange={(event) => setEditText(event.target.value)}
                              maxLength={2000}
                              className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none"
                            />
                            <button type="button" onClick={() => setEditingMessageId("")} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                              <X size={15} />
                            </button>
                            <button type="submit" disabled={!editText.trim() || actionLoading} className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-white disabled:opacity-40">
                              <Check size={15} />
                            </button>
                          </form>
                        ) : message.isUnsent ? (
                          <div className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm italic text-slate-400">
                            This message was unsent
                          </div>
                        ) : (
                          <>
                            {message.forwarded && (
                              <span className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold text-slate-400">
                                <Forward size={10} /> Forwarded
                              </span>
                            )}
                            {message.replyTo && (
                              <div className={`mb-1 max-w-full rounded-xl border-l-4 px-3 py-2 text-xs ${own ? "border-white/50 bg-white/10" : "border-slate-300 bg-slate-100"}`}>
                                <p className="font-bold opacity-80">{message.replyTo.sender?.username || "Message"}</p>
                                <p className="truncate opacity-70">{message.replyTo.isUnsent ? "Message was unsent" : message.replyTo.text || "Attachment"}</p>
                              </div>
                            )}
                            <div className={`overflow-hidden ${
                              isEmojiOnly(message.text) && !message.attachment?.dataUrl && !message.image?.dataUrl
                                ? "bg-transparent text-slate-900"
                                : `rounded-2xl text-sm leading-relaxed ${own
                                  ? "rounded-br-md bg-slate-950 text-white"
                                  : "rounded-bl-md bg-white text-slate-800 shadow-sm"}`
                            }`}>
                              <MessageMedia message={message} />
                              {message.text && (
                                <p className={`whitespace-pre-wrap break-words ${
                                  isEmojiOnly(message.text) && !message.attachment?.dataUrl && !message.image?.dataUrl
                                    ? "px-1 py-2 text-5xl leading-none"
                                    : "px-4 py-2.5"
                                }`}>{message.text}</p>
                              )}
                            </div>
                            {message.reactions?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(message.reactions.reduce((items, reaction) => ({ ...items, [reaction.emoji]: (items[reaction.emoji] || 0) + 1 }), {})).map(([emoji, count]) => (
                                  <button key={emoji} type="button" onClick={() => reactToMessage(message._id, emoji)} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs shadow-sm">{emoji} {count}</button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {!sameSender && (
                          <span className="mt-1 px-1 text-[10px] text-slate-400">
                            {message.editedAt && !message.isUnsent ? "Edited · " : ""}{timeLabel(message.createdAt)}
                            {own && index === messages.length - 1 ? ` · ${(message.readBy?.length || 0) > 1 ? "Seen" : "Sent"}` : ""}
                          </span>
                        )}
                      </div>
                      {!own && !message.isUnsent && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActionMessageId((id) => id === message._id ? "" : message._id)}
                            aria-label="Message actions"
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 opacity-100 transition hover:bg-white hover:text-slate-700 sm:opacity-0 sm:group-hover/message:opacity-100"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {actionMessageId === message._id && (
                            <div className="absolute bottom-9 left-0 z-20 w-40 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setForwardingMessage(message);
                                  setActionMessageId("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Forward size={14} /> Forward
                              </button>
                              <button type="button" onClick={() => { setReplyingTo(message); setActionMessageId(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Reply size={14} /> Reply</button>
                              <div className="flex justify-center gap-1 border-t border-slate-100 px-2 py-2">
                                {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => <button key={emoji} type="button" onClick={() => { reactToMessage(message._id, emoji); setActionMessageId(""); }} className="text-base transition hover:scale-125">{emoji}</button>)}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUnsendTarget(message);
                                  setActionMessageId("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Unsend
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <Avatar user={activeUser} online={onlineUserIds.includes(getUserId(activeUser))} size="mx-auto h-16 w-16" />
                      <h3 className="mt-3 font-bold text-slate-900">{displayName(activeUser)}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{activeUser.role}</p>
                      <p className="mt-1 text-sm text-slate-400">Send a message to start the conversation.</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">
                {replyingTo && (
                  <div className="mb-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2">
                    <Reply size={15} className="text-slate-400" />
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700">Replying to {replyingTo.sender?.username}</p><p className="truncate text-xs text-slate-400">{replyingTo.text || "Attachment"}</p></div>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400"><X size={16} /></button>
                  </div>
                )}
                {attachment && (
                  <div className="relative mb-3 w-fit">
                    {attachment.kind === "image" && (
                      <img src={attachment.dataUrl} alt="Attachment preview" className="h-24 w-24 rounded-2xl object-cover" />
                    )}
                    {attachment.kind === "video" && (
                      <video src={attachment.dataUrl} className="h-24 w-40 rounded-2xl bg-black object-cover" />
                    )}
                    {attachment.kind === "audio" && (
                      <div className="flex h-20 max-w-xs items-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-600">
                        <span className="truncate">🎵 {attachment.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      aria-label="Remove attachment"
                      className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {attachmentError && <p className="mb-2 text-xs font-medium text-red-600">{attachmentError}</p>}
                <div className="flex items-end gap-2">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4"
                    onChange={handleAttachment}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    aria-label="Attach photo, video, or audio"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                  >
                    <Paperclip size={20} />
                  </button>
                  <div className="relative">
                    <button type="button" onClick={() => setEmojiOpen((open) => !open)} aria-label="Choose emoji" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><Smile size={20} /></button>
                    {emojiOpen && <div className="absolute bottom-14 right-0 z-30 grid w-48 grid-cols-6 gap-1 rounded-xl bg-white p-2 shadow-xl">{["😀","😂","😍","🥰","😎","😭","😮","😡","👍","👏","🙏","❤️","🎉","🔥","✅","💯","😊","🤔"].map((emoji) => <button key={emoji} type="button" onClick={() => { setDraft((value) => `${value}${emoji}`); setEmojiOpen(false); }} className="grid h-7 w-7 place-items-center text-xl transition hover:scale-125">{emoji}</button>)}</div>}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit(event);
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Type a message..."
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={(!draft.trim() && !attachment) || sending}
                    aria-label="Send message"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <MessageCircle size={28} />
                </span>
                <h2 className="mt-4 font-bold text-slate-900">Your messages</h2>
                <p className="mt-1 max-w-xs text-sm text-slate-400">
                  {currentUser?.role === "Patient"
                    ? "Select a conversation or start a new one with an administrator or hospital staff member."
                    : "Select a conversation or start a new one with a patient, admin, or staff member."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      {forwardingMessage && (
        <div className="app-viewport-overlay fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">Forward message</h2>
                <p className="text-xs text-slate-400">Choose a recipient</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForwardingMessage(null);
                  setForwardSearch("");
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <label className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2.5">
                <Search size={15} className="text-slate-400" />
                <input
                  autoFocus
                  value={forwardSearch}
                  onChange={(event) => setForwardSearch(event.target.value)}
                  placeholder="Search people"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
            </div>
            <div className="scrollbar-hide flex-1 overflow-y-auto pb-2">
              {forwardContacts.map((contact) => (
                <button
                  key={contact._id}
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleForward(contact)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Avatar user={contact} online={onlineUserIds.includes(contact._id)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName(contact)}</p>
                    <p className="text-xs text-slate-400">{contact.role}</p>
                  </div>
                  <Forward className="ml-auto text-slate-400" size={16} />
                </button>
              ))}
              {!forwardContacts.length && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No people found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {unsendTarget && (
        <div className="app-viewport-overlay fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Unsend message?</h2>
              <p className="mt-1 text-sm text-slate-500">Choose who this message should be removed for.</p>
            </div>
            <div className="space-y-1 p-3">
              {getUserId(unsendTarget.sender) === currentUserId && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    const messageId = unsendTarget._id;
                    setUnsendTarget(null);
                    await handleUnsend(messageId, "everyone");
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left transition hover:bg-red-50 disabled:opacity-50"
                >
                  <p className="text-sm font-bold text-red-600">Unsend for everyone</p>
                  <p className="mt-0.5 text-xs text-slate-400">People in this chat will see that the message was unsent.</p>
                </button>
              )}
              <button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  const messageId = unsendTarget._id;
                  setUnsendTarget(null);
                  await handleUnsend(messageId, "you");
                }}
                className="w-full rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
              >
                <p className="text-sm font-bold text-slate-900">Unsend for you</p>
                <p className="mt-0.5 text-xs text-slate-400">Other people in this chat will still see the message.</p>
              </button>
            </div>
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => setUnsendTarget(null)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
