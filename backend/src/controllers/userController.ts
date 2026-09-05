import { Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  getUserProfile,
  updateUserNickname,
  deleteUserAccount,
  uploadUserAvatar,
} from '../services/userService';

// 이미지 파일만 허용, 메모리에 임시 저장
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
    }
  },
});

export { upload };

export const getProfileHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const profile = await getUserProfile(userId);
    return res.json({ profile });
  } catch (error) {
    console.error('Error in getProfileHandler:', error);
    return res.status(500).json({ error: '프로필을 불러오는데 실패했습니다.' });
  }
};

export const updateProfileHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2) {
      return res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다.' });
    }

    await updateUserNickname(userId, nickname.trim());
    return res.json({ message: '프로필이 수정되었습니다.' });
  } catch (error) {
    console.error('Error in updateProfileHandler:', error);
    return res.status(500).json({ error: '프로필을 수정하는데 실패했습니다.' });
  }
};

export const deleteUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    await deleteUserAccount(userId);

    // 탈퇴 후 쿠키 삭제
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.json({ message: '회원 탈퇴 처리가 완료되었습니다.' });
  } catch (error) {
    console.error('Error in deleteUserHandler:', error);
    return res.status(500).json({ error: '회원 탈퇴 중 오류가 발생했습니다.' });
  }
};

export const uploadAvatarHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 없습니다.' });
    }

    const avatarUrl = await uploadUserAvatar(userId, req.file.buffer, req.file.mimetype);
    return res.json({ avatarUrl });
  } catch (error) {
    console.error('Error in uploadAvatarHandler:', error);
    return res.status(500).json({ error: '아바타 업로드에 실패했습니다.' });
  }
};
