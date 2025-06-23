import { Router } from 'express';
import { signUp } from '../controllers/user.controller.js';


const router = Router();

router.route('/sign-up').get(signUp);



export default router;