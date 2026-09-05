import { Router } from 'express';
import { getCurrentPlantHandler, getCollectionHandler } from '../controllers/plantController';
import { requireApiAuth } from '../middleware/authMiddleware';

const router = Router();

// 현재 키우고 있는 식물 조회 (없으면 자동 생성)
router.get('/current', requireApiAuth, getCurrentPlantHandler);

// 도감(수집 완료된 식물) 조회
router.get('/collection', requireApiAuth, getCollectionHandler);

export default router;
