import { Router } from "express";
import {
  createIndividualChat,
  createGroupChat,
  getChat,
  getGroupChat,
  addMember,
  removeMember,
  deleteGroup,
  leaveGroup,
} from "../controllers/chat.controller.js";
import jwtVerify from "../middlewares/auth.middleware.js";

const router = Router();

// Individual chat route
router.post("/new/individual", jwtVerify, createIndividualChat);

// Group chat routes
router.post("/new/group", jwtVerify, createGroupChat);
router.get("/group", jwtVerify, getGroupChat);
router.put("/group/member/add", jwtVerify, addMember);
router.put("/group/member/remove", jwtVerify, removeMember);
router.delete("/group/delete/:chat_id", jwtVerify, deleteGroup);
router.put("/group/leave/:chat_id", jwtVerify, leaveGroup);

// Fetch all user chats (individual and group)
router.get("/all", jwtVerify, getChat);

export default router;
