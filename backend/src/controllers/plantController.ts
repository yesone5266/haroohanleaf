import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getCurrentPlant, getCollection, createNewSeed } from '../services/plantService';

export const getCurrentPlantHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    let plant = await getCurrentPlant(userId);

    // 현재 키우는 식물이 없으면 새로 생성 (최초 가입 후 진입 시 등)
    if (!plant) {
      plant = await createNewSeed(userId);
    }

    // plant가 여전히 null이라면, 모든 식물을 다 모은 상태임
    return res.json({ plant });
  } catch (error) {
    console.error('Error in getCurrentPlantHandler:', error);
    return res.status(500).json({ error: '현재 식물을 불러오는데 실패했습니다.' });
  }
};

export const getCollectionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const collection = await getCollection(userId);
    return res.json({ collection });
  } catch (error) {
    console.error('Error in getCollectionHandler:', error);
    return res.status(500).json({ error: '도감을 불러오는데 실패했습니다.' });
  }
};
