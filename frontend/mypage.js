document.addEventListener('DOMContentLoaded', async () => {
  const profileName = document.querySelector('.profile-name');
  const profileEmail = document.querySelector('.profile-email');
  const profileAvatarImg = document.querySelector('.profile-avatar img');
  const statCompletedTodos = document.getElementById('stat-completed-todos');
  const statCollectedPlants = document.getElementById('stat-collected-plants');
  
  const editBtn = document.querySelector('.btn-edit');
  const logoutBtn = document.querySelector('.btn-action.logout');
  const deleteBtn = document.querySelector('.btn-action.delete');
  const avatarArea = document.querySelector('.profile-avatar');
  const avatarInput = document.getElementById('avatar-input');

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const { profile } = await response.json();
        
        if (profile) {
          if (profileEmail) profileEmail.textContent = profile.email || '이메일 정보 없음';
          if (profileName) profileName.textContent = profile.nickname || '사용자';
          
          // 저장된 아바타 URL이 있으면 이미지 교체
          if (profileAvatarImg && profile.avatarUrl) {
            profileAvatarImg.src = profile.avatarUrl;
          }

          if (statCompletedTodos) statCompletedTodos.textContent = profile.stats.completedTodos;
          if (statCollectedPlants) statCollectedPlants.textContent = profile.stats.collectedPlants;
        }
      } else {
        // 인증 실패 시
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('사용자 정보를 가져오는 데 실패했습니다:', error);
    }
  };

  // 1. 프로필 불러오기 실행
  await loadUserProfile();

  // 2. 아바타 클릭 시 파일 탐색기 열기
  if (avatarArea && avatarInput) {
    avatarArea.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await fetch('/api/users/me/avatar', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { avatarUrl } = await response.json();
          if (profileAvatarImg) profileAvatarImg.src = avatarUrl;
        } else {
          const data = await response.json();
          AppDialog.alert(data.error || '이미지 업로드에 실패했습니다.');
        }
      } catch (error) {
        console.error('아바타 업로드 오류:', error);
        AppDialog.alert('서버와 통신할 수 없습니다.');
      }

      // 동일 파일 재선택을 위해 input 초기화
      avatarInput.value = '';
    });
  }

  // 3. 닉네임 수정
  if (editBtn) {
    editBtn.addEventListener('click', async () => {
      const currentNickname = profileName.textContent;
      const newNickname = await AppDialog.prompt('새로운 닉네임을 입력하세요:', currentNickname);
      
      if (newNickname !== null && newNickname.trim() !== '') {
        if (newNickname.trim().length < 2) {
          AppDialog.alert('닉네임은 2자 이상이어야 합니다.');
          return;
        }

        try {
          const response = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: newNickname.trim() }),
          });

          if (response.ok) {
            await loadUserProfile();
          } else {
            const data = await response.json();
            AppDialog.alert(data.error || '프로필 수정에 실패했습니다.');
          }
        } catch (error) {
          console.error('프로필 수정 중 오류:', error);
          AppDialog.alert('서버와 통신할 수 없습니다.');
        }
      }
    });
  }

  // 3. 로그아웃
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (!await AppDialog.confirm('로그아웃 하시겠습니까?')) return;

      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
          window.location.href = '/login';
        } else {
          AppDialog.alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('로그아웃 요청 실패:', error);
        AppDialog.alert('서버와 통신할 수 없습니다.');
      }
    });
  }

  // 4. 회원 탈퇴
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmFirst = await AppDialog.confirm('정말 회원 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.');
      if (!confirmFirst) return;

      const confirmSecond = await AppDialog.confirm('최종 확인입니다. 탈퇴를 진행하시겠습니까?');
      if (!confirmSecond) return;

      try {
        const response = await fetch('/api/users/me', { method: 'DELETE' });
        if (response.ok) {
          AppDialog.alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
          window.location.href = '/login';
        } else {
          const data = await response.json();
          AppDialog.alert(data.error || '탈퇴 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('회원 탈퇴 요청 실패:', error);
        AppDialog.alert('서버와 통신할 수 없습니다.');
      }
    });
  }
});
