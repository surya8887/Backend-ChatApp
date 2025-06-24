import { Router } from "express";
import {
  createGroupChat,
  getChat,
  getGroupChat,
  removeMember,
  deleteGroup,
  leaveGroup,
} from "../controllers/chat.controller.js";
import jwtVerify from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/new").post(jwtVerify, createGroupChat);
router.route("/get").get(jwtVerify, getChat);
router.route("/group-get").get(jwtVerify, getGroupChat);
// router.route("/logout").get(jwtVerify, logout);

export default router;
