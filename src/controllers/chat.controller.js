import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { emitEvent } from "../utils/feature.js";
import { ALERT, REFETCHS_CHAT, } from "../constant.js";
import { getOtherMember } from "../libs/helper.js";


// 📌 Create chat (1-to-1 or group)
const createChat = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  
  const { name, members } = req.body;

  const currentUserId = req.user._id.toString();

  if (!Array.isArray(members) || members.length === 0) {
    return next(new ApiError(400, "Please provide member(s) to chat with"));
  }

  const allMembers = [...new Set([...members.map(String), currentUserId])];

  // One-to-one logic
  if (allMembers.length === 2) {
    const [userA, userB] = allMembers;

    if (userA === userB) {
      return next(new ApiError(400, "Cannot create chat with yourself"));
    }

    let chat = await Chat.findOne({
      groupChat: false,
      members: { $all: [userA, userB], $size: 2 },
    }).populate("members", "name avatar");

    if (chat) {
      return res.status(200).json(new ApiResponse(200, chat, "Existing 1-to-1 chat retrieved"));
    }

    chat = await Chat.create({ groupChat: false, members: [userA, userB] });
    const fullChat = await Chat.findById(chat._id).populate("members", "name avatar");

    return res.status(201).json(new ApiResponse(201, fullChat, "1-to-1 chat created"));
  }

  // Group chat logic
  if (!name) return next(new ApiError(400, "Group name is required"));

  const chat = await Chat.create({
    name,
    groupChat: true,
    creator: req.user._id,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, `Welcome to group: ${name}`);
  emitEvent(req, REFETCHS_CHAT, "newGroupChat", allMembers);

  return res.status(201).json(new ApiResponse(201, chat, "Group chat created"));
});

const getMyChats = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const chats = await Chat.find({ members: userId }).populate("members", "name avatar");

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMembers = members.filter(m => m._id.toString() !== userId);
    const currentUser = members.find(m => m._id.toString() === userId);
    const other = otherMembers[0];

    const defaultAvatar = "https://ui-avatars.com/api/?name=User";

    const response = {
      _id,
      groupChat,
      name: groupChat
        ? name
        : other?.name || "Unknown",
      avatar: groupChat
        ? members.slice(0, 3).map((m) => m.avatar?.url || defaultAvatar)
        : [other?.avatar?.url || defaultAvatar],
      members: groupChat
        ? members.map((m) => m._id)
        : [currentUser?._id, other?._id].filter(Boolean), // ensures both IDs if available
    };

    return response;
  });

  return res.status(200).json(
    new ApiResponse(200, transformedChats, "Chats retrieved")
  );
});


// 👥 Get group chats (where user is creator)
const getGroupChat = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ groupChat: true, creator: req.user._id }).populate("members", "name avatar");

  const groups = chats.map(({ _id, name, groupChat, members }) => ({
    _id,
    name,
    groupChat,
    avatar: members.slice(0, 3).map((m) => m?.avatar?.url || ""),
  }));

  return res.status(200).json(new ApiResponse(200, groups, "Groups retrieved"));
});

// ➕ Add members to a group
const addMembers = asyncHandler(async (req, res, next) => {
  const { chatId, members } = req.body;
  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ApiError(404, "Chat not found"));
  if (!chat.groupChat) return next(new ApiError(400, "Not a group chat"));
  if (chat.creator.toString() !== req.user._id.toString()) return next(new ApiError(403, "Unauthorized"));

  const uniqueNewMembers = members.filter(
    (id) => !chat.members.map((m) => m.toString()).includes(id)
  );

  if (chat.members.length + uniqueNewMembers.length > 100)
    return next(new ApiError(400, "Group limit exceeded"));

  chat.members.push(...uniqueNewMembers);
  await chat.save();

  emitEvent(req, ALERT, chat.members, "New members added");
  emitEvent(req, REFETCHS_CHAT, "addMembers", chat.members);

  return res.status(200).json(new ApiResponse(200, null, "Members added"));
});

// ➖ Remove member
const removeMember = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;
  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ApiError(404, "Chat not found"));
  if (!chat.groupChat) return next(new ApiError(400, "Not a group chat"));
  if (chat.creator.toString() !== req.user._id.toString()) return next(new ApiError(403, "Unauthorized"));
  if (chat.members.length <= 3) return next(new ApiError(400, "Minimum 3 members required"));

  chat.members = chat.members.filter((m) => m.toString() !== userId);
  await chat.save();

  emitEvent(req, ALERT, chat.members, "A member was removed");
  emitEvent(req, REFETCHS_CHAT, "removeMember", chat.members);

  return res.status(200).json(new ApiResponse(200, null, "Member removed"));
});

// 🚪 Leave group
const leaveGroup = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new ApiError(404, "Chat not found"));
  if (!chat.groupChat) return next(new ApiError(400, "Not a group chat"));

  chat.members = chat.members.filter((m) => m.toString() !== req.user._id.toString());

  if (chat.members.length < 3) {
    await chat.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, "Group deleted (too few members)"));
  }

  if (chat.creator.toString() === req.user._id.toString()) {
    chat.creator = chat.members[Math.floor(Math.random() * chat.members.length)];
  }

  await chat.save();
  emitEvent(req, ALERT, chat.members, `${req.user.name} left the group`);

  return res.status(200).json(new ApiResponse(200, null, "Left group"));
});
/*

// 📎 Send attachments
const sendAttachments = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;
  const files = req.files || [];

  if (files.length === 0 || files.length > 5)
    return next(new ApiError(400, "Attach 1–5 files"));

  const [chat, sender] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user._id),
  ]);

  if (!chat) return next(new ApiError(404, "Chat not found"));

  const attachments = await uploadFilesToCloudinary(files);

  const message = await Message.create({
    sender: sender._id,
    chat: chatId,
    attachments,
  });

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: {
      ...message.toObject(),
      sender: { _id: sender._id, name: sender.name },
    },
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

  return res.status(200).json(new ApiResponse(200, message, "Attachment sent"));
});

// 🔍 Get chat details
const getChatDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const chat = req.query.populate === "true"
    ? await Chat.findById(id).populate("members", "name avatar").lean()
    : await Chat.findById(id);

  if (!chat) return next(new ApiError(404, "Chat not found"));

  if (req.query.populate === "true") {
    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar?.url || "",
    }));
  }

  return res.status(200).json(new ApiResponse(200, chat, "Chat details"));
});

// ✏️ Rename group
const renameGroup = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new ApiError(404, "Chat not found"));
  if (!chat.groupChat || chat.creator.toString() !== req.user._id.toString())
    return next(new ApiError(403, "Unauthorized"));

  chat.name = req.body.name;
  await chat.save();

  emitEvent(req, REFETCHS_CHAT, "renameGroup", chat.members);
  return res.status(200).json(new ApiResponse(200, null, "Group renamed"));
});

// ❌ Delete chat
const deleteChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new ApiError(404, "Chat not found"));

  const isGroup = chat.groupChat;
  const isCreator = chat.creator?.toString() === req.user._id.toString();
  const isMember = chat.members.map((m) => m.toString()).includes(req.user._id.toString());

  if ((isGroup && !isCreator) || (!isGroup && !isMember)) {
    return next(new ApiError(403, "Not allowed to delete this chat"));
  }

  const messagesWithAttachments = await Message.find({
    chat: chat._id,
    attachments: { $exists: true, $ne: [] },
  });

  const publicIds = messagesWithAttachments.flatMap((msg) =>
    msg.attachments.map((a) => a.public_id)
  );

  await Promise.all([
    deletFilesFromCloudinary(publicIds),
    chat.deleteOne(),
    Message.deleteMany({ chat: chat._id }),
  ]);

  emitEvent(req, REFETCHS_CHAT, "chatDeleted", chat.members);

  return res.status(200).json(new ApiResponse(200, null, "Chat deleted"));
});

// 🧾 Paginated messages
const getMessages = asyncHandler(async (req, res, next) => {
  const chatId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const chat = await Chat.findById(chatId);
  if (!chat) return next(new ApiError(404, "Chat not found"));

  if (!chat.members.map(String).includes(req.user._id.toString()))
    return next(new ApiError(403, "Not allowed"));

  const [messages, count] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    messages: messages.reverse(),
    totalPages: Math.ceil(count / limit),
  }, "Messages retrieved"));
});

*/
// 🔁 Export
export {
  createChat,
  getMyChats,
  getGroupChat,
  addMembers,
  removeMember,
  leaveGroup,
  // sendAttachments,
  // getChatDetails,
  // renameGroup,
  // deleteChat,
  // getMessages,
};
