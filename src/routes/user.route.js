import { Router } from "express";
import { signUp, login,logout } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import jwtVerify from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/sign-up").post(signUp);
router.route("/login").post(login);
router.route("/logout").get(jwtVerify, logout);

export default router;
