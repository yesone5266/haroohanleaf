import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';

dotenv.config();

import authRoutes from './routes/authRoutes';
import { requireAuth, redirectIfAuth, optionalAuth, AuthenticatedRequest } from './middleware/authMiddleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API 라우터
import plantRoutes from './routes/plantRoutes';
import todoRoutes from './routes/todoRoutes';
import userRoutes from './routes/userRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/users', userRoutes);

// .html 직접 요청 필터링 및 클린 URL 리다이렉트
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const cleanPath = req.path.replace(/\.html$/, '');
    if (cleanPath === '/index') {
      return res.redirect('/');
    }
    return res.redirect(cleanPath);
  }
  next();
});

// 정적 페이지 라우트 (인증 상태별 미들웨어 적용)
app.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  } else {
    res.sendFile(path.join(__dirname, '../../frontend/landing.html'));
  }
});

app.get('/login', redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

app.get('/inventory', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/inventory.html'));
});

app.get('/mypage', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/mypage.html'));
});

app.get('/register', redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/register.html'));
});

// 정적 에셋 서빙 (CSS, JS, 이미지 등) - 라우터에 매칭되지 않은 파일들만 서빙하도록 하단 배치
app.use(express.static(path.join(__dirname, '../../frontend')));

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

