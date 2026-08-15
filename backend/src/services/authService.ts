import { supabase, supabaseAdmin } from '../config/supabase';

interface RegisterPayload {
  email: string;
  nickname: string;
  password: string;
}

export const registerUser = async ({ email, nickname, password }: RegisterPayload) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname },
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: data.user.id, nickname });

    if (profileError) {
      throw profileError;
    }
  }

  return data;
};
