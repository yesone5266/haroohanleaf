import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  getTodosByDate,
  createTodo,
  updateTodoTitle,
  toggleTodoCompleted,
  deleteTodo,
} from '../services/todoService';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const getTodosHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const date = req.query.date as string | undefined;
    if (!date || !DATE_REGEX.test(date)) {
      return res.status(400).json({ error: 'date 쿼리 파라미터가 필요합니다. (형식: YYYY-MM-DD)' });
    }

    const todos = await getTodosByDate(userId, date);
    return res.json({ todos });
  } catch (error) {
    console.error('Error in getTodosHandler:', error);
    return res.status(500).json({ error: '할 일 목록을 불러오는데 실패했습니다.' });
  }
};

export const createTodoHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { title, targetDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: '할 일 제목을 입력해주세요.' });
    }

    if (!targetDate || !DATE_REGEX.test(targetDate)) {
      return res.status(400).json({ error: '날짜를 올바른 형식으로 입력해주세요. (YYYY-MM-DD)' });
    }

    const todo = await createTodo(userId, title.trim(), targetDate);
    return res.status(201).json({ todo });
  } catch (error) {
    console.error('Error in createTodoHandler:', error);
    return res.status(500).json({ error: '할 일을 추가하는데 실패했습니다.' });
  }
};

export const updateTodoHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: '수정할 제목을 입력해주세요.' });
    }

    const todo = await updateTodoTitle(id, userId, title.trim());
    return res.json({ todo });
  } catch (error) {
    console.error('Error in updateTodoHandler:', error);
    return res.status(500).json({ error: '할 일을 수정하는데 실패했습니다.' });
  }
};

export const toggleTodoHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { id } = req.params;
    const todo = await toggleTodoCompleted(id, userId);
    return res.json({ todo });
  } catch (error) {
    console.error('Error in toggleTodoHandler:', error);
    return res.status(500).json({ error: '할 일 상태를 변경하는데 실패했습니다.' });
  }
};

export const deleteTodoHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { id } = req.params;
    await deleteTodo(id, userId);
    return res.json({ message: '할 일이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error in deleteTodoHandler:', error);
    return res.status(500).json({ error: '할 일을 삭제하는데 실패했습니다.' });
  }
};
