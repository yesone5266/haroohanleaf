import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Express Request 인터페이스 확장 (사용자 정보를 담기 위함)
export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * 인증이 필요한 페이지 접근 시 토큰 검증 및 자동 갱신 미들웨어
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  // Access Token이 없는 경우
  if (!accessToken) {
    // Refresh Token이 있으면 갱신 시도
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
        return next();
      }
    }
    return res.redirect('/login');
  }

  // Access Token 검증
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // 만료된 경우 Refresh Token으로 갱신 시도
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
        return next();
      }
    }
    
    // 갱신 실패 시 쿠키 삭제 후 로그인 페이지로
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.redirect('/login');
  }

  req.user = user;
  next();
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (!accessToken) {
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
      }
    }
    return next();
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
      } else {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }
    } else {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
    }
    return next();
  }

  req.user = user;
  next();
};

/**
 * 이미 로그인된 사용자가 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트하는 미들웨어
 */
export const redirectIfAuth = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.access_token;

  if (accessToken) {
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (user) {
      return res.redirect('/');
    }
  }
  next();
};

/**
 * Refresh Token을 사용하여 새로운 세션을 발급받고 쿠키를 설정하는 헬퍼 함수
 */
async function attemptTokenRefresh(refreshToken: string, res: Response) {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: '',
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      return null;
    }

    const isProd = process.env.NODE_ENV === 'production';

    // 새로운 Access Token 쿠키 설정
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: data.session.expires_in * 1000,
    });

    // Refresh Token이 새로 갱신되었다면 쿠키 업데이트
    if (data.session.refresh_token) {
      res.cookie('refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return { user: data.user };
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}

/**
 * API 라우트용 인증 미들웨어 (실패 시 401 JSON 반환)
 */
export const requireApiAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (!accessToken) {
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
        return next();
      }
    }
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    if (refreshToken) {
      const refreshed = await attemptTokenRefresh(refreshToken, res);
      if (refreshed) {
        req.user = refreshed.user;
        return next();
      }
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(401).json({ error: '세션이 만료되었습니다.' });
  }

  req.user = user;
  next();
};
