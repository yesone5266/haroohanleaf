import { Router } from 'express';
import { register } from '../controllers/authController';
import { login } from '../controllers/loginController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
