import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Chat from "../models/chat.model.js";
import { emitEvent } from "../utils/feature.js";
import { ALERT, REFETCHS_CHAT } from "../constant.js";
import { getOtherMember } from "../libs/helper.js";

//  createIndividual chat 
const createIndividualChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ApiError(400, "User ID is required to start chat"));
  }

  const loggedInUserId = req.user._id;

  // Check if chat already exists between the two
  let chat = await Chat.findOne({
    groupChat: false,
    members: { $all: [loggedInUserId, userId], $size: 2 },
  }).populate("members", "name avatar");

  if (chat) {
    return res
      .status(200)
      .json(new ApiResponse(200, chat, "Existing individual chat retrieved"));
  }

  // If not, create new one
  chat = await Chat.create({
    groupChat: false,
    members: [loggedInUserId, userId],
  });

  const fullChat = await Chat.findById(chat._id).populate(
    "members",
    "name avatar"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, fullChat, "New individual chat created"));
});



// Create Group Chat
const createGroupChat = asyncHandler(async (req, res, next) => {
 console.log(req.body);
 
  const { name, members } = req.body;


  if (!name || !members) {
    return next(new ApiError(400, "Please fill in all fields"));
  }

  if (members.length < 2) {
    return next(
      new ApiError(400, "At least two members are required to create a chat")
    );
  }

  const allMembers = [...members, req.user._id];

  const chat = await Chat.create({
    name,
    groupChat: true,
    members: allMembers,
    creator: req.user._id,
  });

  emitEvent(req, ALERT, `Welcome to this group ${req.user.name}`, allMembers);
  emitEvent(req, REFETCHS_CHAT, "newGroupChat", allMembers);

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Group chat created successfully"));
});

// Get All Chats
const getChat = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user._id }).populate(
    "members",
    "name avatar"
  );

  const transformChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, req.user._id);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar?.url)
        : [otherMember?.avatar?.url],
      name: groupChat ? name : otherMember?.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user._id.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, transformChats, "Chats retrieved successfully"));
});

//  Get Chat by ID
const getGroupChat = asyncHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.user._id);

  const groupChats = await Chat.aggregate([
    {
      $match: {
        groupChat: true,
        members: { $in: [user_id] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id", // ✅ correct field
        as: "membersData",
      },
    },
    {
      $project: {
        _id: 1, // ✅ fix this
        name: 1,
        groupChat: 1,
        avatar: {
          $slice: [
            {
              $map: {
                input: "$membersData",
                as: "m",
                in: "$$m.avatar.url",
              },
            },
            3,
          ],
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, groupChats, "Groups retrieved successfully"));
});


// Remove Member from Group
const removeMember = asyncHandler(async (req, res, next) => {
  const { chat_id, user_idToRemove } = req.body;

  const chat = await Chat.findBy_id(chat_id);

  if (!chat) {
    return next(new ApiError(404, "Chat not found"));
  }

  if (!chat.groupChat) {
    return next(new ApiError(400, "Not a group chat"));
  }

  if (chat.creator.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, "Only group creator can remove members"));
  }

  chat.members = chat.members.filter(
    (_id) => _id.toString() !== user_idToRemove.toString()
  );

  await chat.save();

  emitEvent(req, REFETCHS_CHAT, "memberRemoved", chat.members);
  emitEvent(req, ALERT, `A member was removed`, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Member removed successfully"));
});

// Delete Group
const deleteGroup = asyncHandler(async (req, res, next) => {
  const { chat_id } = req.params;

  const chat = await Chat.findBy_id(chat_id);

  if (!chat) {
    return next(new ApiError(404, "Chat not found"));
  }

  if (!chat.groupChat) {
    return next(new ApiError(400, "Not a group chat"));
  }

  if (chat.creator.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, "Only the creator can delete this group"));
  }

  await chat.deleteOne();

  emitEvent(req, REFETCHS_CHAT, "groupDeleted", chat.members);
  emitEvent(req, ALERT, `Group "${chat.name}" was deleted`, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group deleted successfully"));
});

// Leave Group
const leaveGroup = asyncHandler(async (req, res, next) => {
  const { chat_id } = req.params;

  const chat = await Chat.findBy_id(chat_id);

  if (!chat) {
    return next(new ApiError(404, "Chat not found"));
  }

  if (!chat.groupChat) {
    return next(new ApiError(400, "Not a group chat"));
  }

  chat.members = chat.members.filter(
    (_id) => _id.toString() !== req.user._id.toString()
  );

  if (chat.members.length === 0) {
    await chat.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Group deleted as last member left"));
  }

  await chat.save();

  emitEvent(req, REFETCHS_CHAT, "memberLeft", chat.members);
  emitEvent(req, ALERT, `${req.user.name} left the group`, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Left group successfully"));
});

// Export
export {
  createGroupChat,
  getChat,
  getGroupChat,
  removeMember,
  deleteGroup,
  leaveGroup,
};
