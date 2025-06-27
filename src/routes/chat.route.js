import { Router } from "express";
import {
  createChat,
  getMyChats,
 
} from "../controllers/chat.controller.js";
import jwtVerify from "../middlewares/auth.middleware.js";

const router = Router();

// Unified chat creation (auto handles 1-to-1 or group based on members count)
router.post("/create", jwtVerify, createChat);
router.get("/all", jwtVerify, getMyChats);

// Fetch all user chats (individual and group)

// // Group chat specific routes
// router.get("/group", jwtVerify, getGroupChat);
// router.put("/group/member/add", jwtVerify, addMember);
// router.put("/group/member/remove", jwtVerify, removeMember);
// router.delete("/group/delete/:chat_id", jwtVerify, deleteGroup);
// router.put("/group/leave/:chat_id", jwtVerify, leaveGroup);

export default router;
