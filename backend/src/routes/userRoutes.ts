import { Router } from 'express';
import {
  getProfileHandler,
  updateProfileHandler,
  deleteUserHandler,
  uploadAvatarHandler,
  upload,
} from '../controllers/userController';
import { requireApiAuth } from '../middleware/authMiddleware';

const router = Router();

// 마이페이지 기능
router.get('/me', requireApiAuth, getProfileHandler);
router.patch('/me', requireApiAuth, updateProfileHandler);
router.delete('/me', requireApiAuth, deleteUserHandler);

// 프로필 아바타 업로드
router.post('/me/avatar', requireApiAuth, upload.single('avatar'), uploadAvatarHandler);

export default router;
