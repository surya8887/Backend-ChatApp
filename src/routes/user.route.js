import { Router } from "express";
import { signUp,login } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/sign-up").post(signUp);
router.route("/login").post(login);

export default router;
