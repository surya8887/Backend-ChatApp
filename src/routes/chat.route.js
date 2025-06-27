import { Router } from "express";
import {
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
  // getMessages
} from "../controllers/chat.controller.js";
import jwtVerify from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"; // if you're using multer for attachments

const router = Router();

// ✅ Create Chat (handles 1-to-1 & group)
router.post("/create", jwtVerify, createChat);

// ✅ Get All Chats
router.get("/all", jwtVerify, getMyChats);

// ✅ Group Chat Routes
router.get("/group", jwtVerify, getGroupChat);
router.put("/group/member/add", jwtVerify, addMembers);
router.put("/group/member/remove", jwtVerify, removeMember);
router.put("/group/leave/:id", jwtVerify, leaveGroup);
// router.put("/group/rename/:id", jwtVerify, renameGroup);
// router.delete("/group/delete/:id", jwtVerify, deleteChat);

// // ✅ Chat Details
// router.get("/details/:id", jwtVerify, getChatDetails);

// // ✅ Attachments
// router.post("/attachments", jwtVerify, upload.array("files", 5), sendAttachments);

// // ✅ Messages with Pagination
// router.get("/messages/:id", jwtVerify, getMessages);

export default router;
