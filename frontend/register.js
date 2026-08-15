document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const emailInput = document.getElementById('email');
  const nicknameInput = document.getElementById('nickname');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('password-confirm');
  const errorMessage = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  /** 에러 메시지를 표시합니다. */
  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  };

  /** 에러 메시지를 숨깁니다. */
  const clearError = () => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  };

  /** 버튼을 로딩 상태로 전환합니다. */
  const setLoading = (isLoading) => {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? '가입 중...' : '가입하기';
  };

  /** 이메일 형식을 검사합니다. */
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // 클라이언트 측 유효성 검사
    if (!isValidEmail(email)) {
      showError('올바른 이메일 형식이 아닙니다.');
      emailInput.focus();
      return;
    }
    if (nickname.length < 2) {
      showError('닉네임은 2자 이상이어야 합니다.');
      nicknameInput.focus();
      return;
    }
    if (password.length < 6) {
      showError('비밀번호는 6자 이상이어야 합니다.');
      passwordInput.focus();
      return;
    }
    if (password !== passwordConfirm) {
      showError('비밀번호가 일치하지 않습니다.');
      passwordConfirmInput.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nickname, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result.error || '회원가입 중 오류가 발생했습니다.');
        return;
      }

      // 가입 성공 → 로그인 페이지로 이동
      window.location.href = '/login';
    } catch {
      showError('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  });
});
