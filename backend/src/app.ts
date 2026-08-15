import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/authRoutes';


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API 라우터
app.use('/api/auth', authRoutes);

// 정적 에셋 서빙 (CSS, JS, 이미지 등)
app.use(express.static(path.join(__dirname, '../../frontend')));

// 정적 페이지 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/inventory.html'));
});

app.get('/mypage', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/mypage.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/register.html'));
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

