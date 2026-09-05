import { Request, Response } from 'express';
import { registerUser } from '../services/authService';

/**
 * POST /api/auth/register
 * 서버 측 유효성 검사 후 authService를 통해 회원가입 처리
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, nickname, password } = req.body;

  // 필수 필드 누락 검사
  if (!email || !nickname || !password) {
    res.status(400).json({ error: '이메일, 닉네임, 비밀번호를 모두 입력해주세요.' });
    return;
  }

  // 닉네임 최소 길이 검사
  if (nickname.trim().length < 2) {
    res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다.' });
    return;
  }

  // 비밀번호 최소 길이 검사
  if (password.length < 6) {
    res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    return;
  }

  try {
    const data = await registerUser({ email, nickname: nickname.trim(), password });
    res.status(201).json({ message: '회원가입이 완료되었습니다.', user: data.user });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[register] Supabase error:', error.message);

      const message = error.message.toLowerCase();
      const isDuplicateEmail =
        message.includes('already registered') ||
        message.includes('already been registered') ||
        message.includes('user already exists') ||
        message.includes('email address already in use') ||
        message.includes('email already in use') ||
        message.includes('duplicate') ||
        message.includes('unique constraint');

      if (isDuplicateEmail) {
        res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
        return;
      }

      if (message.includes('invalid email')) {
        res.status(400).json({ error: '올바른 이메일 형식이 아닙니다.' });
        return;
      }
    }
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
};

/**
 * POST /api/auth/logout
 * 인증 쿠키들을 제거하여 로그아웃 처리
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.status(200).json({ message: '로그아웃 되었습니다.' });
};

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보 반환 (requireAuth 미들웨어를 거쳐 req.user에 적재됨)
 */
export const getMe = async (req: any, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
    return;
  }
  res.status(200).json({ user: req.user });
};
