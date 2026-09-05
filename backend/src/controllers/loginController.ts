import { Request, Response } from 'express';
import { loginUser } from '../services/loginService';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: '이메일과 비밀번호를 모두 입력해주세요.' });
    return;
  }

  try {
    const data = await loginUser({ email, password });
    
    if (!data.session) {
      res.status(401).json({ error: '로그인 세션을 생성할 수 없습니다.' });
      return;
    }

    // 쿠키 옵션 설정
    const isProd = process.env.NODE_ENV === 'production';
    
    // Access Token 쿠키 (유효기간: Supabase 세션 만료 시간, 기본 3600초)
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: data.session.expires_in * 1000,
    });

    // Refresh Token 쿠키 (유효기간: 30일)
    if (data.session.refresh_token) {
      res.cookie('refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json({ message: '로그인에 성공했습니다.', user: data.user });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[login] Supabase error:', error.message);

      const message = error.message.toLowerCase();

      if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
        res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }

      if (message.includes('email not confirmed')) {
        res.status(401).json({ error: '이메일 인증이 완료되지 않았습니다.' });
        return;
      }
    }
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
};
