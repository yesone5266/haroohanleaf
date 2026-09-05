import { Router } from 'express';
import { register, logout, getMe } from '../controllers/authController';
import { login } from '../controllers/loginController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
