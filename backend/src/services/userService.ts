import { supabaseAdmin } from '../config/supabase';

interface UserProfileStats {
  completedTodos: number;
  collectedPlants: number;
}

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  stats: UserProfileStats;
}

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // 1. 유저 계정 정보 (이메일 등) 가져오기
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw userError || new Error('User not found');
  }

  // 2. 프로필 정보 (닉네임, 아바타 URL) 가져오기
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('nickname, avatar_url')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  // 3. 통계 쿼리 - 완료한 할 일 수
  const { count: completedTodos, error: todoError } = await supabaseAdmin
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true);

  if (todoError) throw todoError;

  // 4. 통계 쿼리 - 수집한 식물 수
  const { count: collectedPlants, error: plantError } = await supabaseAdmin
    .from('plants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'collected');

  if (plantError) throw plantError;

  return {
    id: userId,
    email: userData.user.email ?? '',
    nickname: profileData?.nickname ?? '',
    avatarUrl: profileData?.avatar_url ?? null,
    stats: {
      completedTodos: completedTodos ?? 0,
      collectedPlants: collectedPlants ?? 0,
    },
  };
};

export const updateUserNickname = async (userId: string, nickname: string): Promise<void> => {
  // 1. profiles 테이블 업데이트
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ nickname })
    .eq('id', userId);

  if (profileError) throw profileError;

  // 2. auth.users 의 user_metadata 업데이트
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { nickname },
  });

  if (authError) throw authError;
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
  // auth.users 테이블에서 삭제하면 CASCADE에 의해 연관된 profiles, todos, plants도 삭제됩니다 (DB 설정 의존)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
};

export const uploadUserAvatar = async (userId: string, fileBuffer: Buffer, mimeType: string): Promise<string> => {
  const fileExtension = mimeType.split('/')[1];
  // 유저마다 고유한 경로에 저장하고 캐시 방지를 위해 타임스탬프를 파일명에 포함
  const filePath = `${userId}/avatar_${Date.now()}.${fileExtension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Public URL 가져오기
  const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  // profiles 테이블에 URL 저장
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return avatarUrl;
};
