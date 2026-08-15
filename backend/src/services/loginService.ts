import { supabase } from '../config/supabase';

interface LoginPayload {
  email: string;
  password: string;
}

export const loginUser = async ({ email, password }: LoginPayload) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
};
