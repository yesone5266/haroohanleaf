import { supabase, supabaseAdmin } from '../config/supabase';
import { createNewSeed } from './plantService';

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

    // ⭐ 유저 프로필이 정상적으로 만들어진 직후에 최초 씨앗 1개 발급
    await createNewSeed(data.user.id);
  }

  return data;
};
