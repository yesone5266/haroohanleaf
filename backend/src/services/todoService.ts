import { supabaseAdmin } from '../config/supabase';
import { getCurrentPlant, addExp } from './plantService';

const TODO_COMPLETE_EXP = 10;

interface Todo {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  target_date: string;
  created_at: string;
}

export const getTodosByDate = async (userId: string, targetDate: string): Promise<Todo[]> => {
  const { data, error } = await supabaseAdmin
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('target_date', targetDate)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createTodo = async (userId: string, title: string, targetDate: string): Promise<Todo> => {
  const { data, error } = await supabaseAdmin
    .from('todos')
    .insert({
      user_id: userId,
      title,
      target_date: targetDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTodoTitle = async (todoId: string, userId: string, title: string): Promise<Todo> => {
  const { data, error } = await supabaseAdmin
    .from('todos')
    .update({ title })
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleTodoCompleted = async (todoId: string, userId: string): Promise<Todo> => {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('todos')
    .select('is_completed')
    .eq('id', todoId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  const newCompletedStatus = !existing.is_completed;

  const { data, error } = await supabaseAdmin
    .from('todos')
    .update({ is_completed: newCompletedStatus })
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // 만약 미완료에서 완료로 변경되었다면 식물 경험치 증가
  if (newCompletedStatus === true) {
    try {
      const currentPlant = await getCurrentPlant(userId);
      if (currentPlant) {
        await addExp(currentPlant.id, userId, TODO_COMPLETE_EXP);
      }
    } catch (expError) {
      console.error('Failed to add exp for completed todo:', expError);
      // 경험치 부여에 실패해도 할 일 완료 상태는 유지하도록 에러는 무시
    }
  }

  return data;
};

export const deleteTodo = async (todoId: string, userId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('todos')
    .delete()
    .eq('id', todoId)
    .eq('user_id', userId);

  if (error) throw error;
};
