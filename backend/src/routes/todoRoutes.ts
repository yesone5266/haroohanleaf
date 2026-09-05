import { Router } from 'express';
import {
  getTodosHandler,
  createTodoHandler,
  updateTodoHandler,
  toggleTodoHandler,
  deleteTodoHandler,
} from '../controllers/todoController';
import { requireApiAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireApiAuth, getTodosHandler);
router.post('/', requireApiAuth, createTodoHandler);
router.patch('/:id', requireApiAuth, updateTodoHandler);
router.patch('/:id/toggle', requireApiAuth, toggleTodoHandler);
router.delete('/:id', requireApiAuth, deleteTodoHandler);

export default router;
