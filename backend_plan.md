# 하루한잎 백엔드 및 데이터베이스 구축 계획

본 문서는 프론트엔드 위주로 구성된 현재 '하루한잎' 프로젝트에 **Node.js 서버**와 **Supabase 데이터베이스**를 도입하기 위한 아키텍처와 구현 계획을 담고 있습니다. 사용자님의 요청에 따라 구현 전 구조와 계획만 먼저 마크다운으로 정리했습니다.

> [!NOTE]
> 기존 `.gemini/GEMINI.md`의 규칙("불필요한 라이브러리나 복잡한 구현은 사용하지 않는다")을 준수하기 위해, 백엔드는 가볍고 직관적인 **Express.js + TypeScript** 조합을 채택하는 것을 권장합니다.

## Open Questions

> [!IMPORTANT]
> 백엔드 개발에 들어가기 전 확인이 필요한 사항들입니다:
> 1. **로그인 방식**: Supabase에서 제공하는 이메일/비밀번호 방식을 사용할지, 아니면 카카오/구글 등의 소셜 로그인을 고려하고 계신가요?
> 2. **프론트엔드-백엔드 분리 여부**: 현재 루트 경로에 있는 프론트엔드 파일들(`index.html`, `inventory.html` 등)을 `frontend/` 폴더로 분리하고, 서버 코드를 `backend/` 폴더에 두는 구조로 개편해도 괜찮을까요?
> 3. **경험치 로직**: 할 일을 완료했을 때 식물 경험치(EXP)가 자동으로 증가하는 로직은 서버에서 안전하게 일괄 처리하도록 설계하는 것이 맞을까요?

---

## 1. 아키텍처 개요 (Architecture)

- **프론트엔드 (Client)**: HTML / Vanilla TypeScript (또는 JS) / CSS
- **백엔드 (Server)**: Node.js + Express.js + TypeScript
- **데이터베이스 (DB)**: Supabase (PostgreSQL 및 Auth 기능 활용)
- **통신 흐름**: Client ↔ (REST API) ↔ Node.js Server ↔ (Supabase Client) ↔ Supabase DB

## 2. 데이터베이스 스키마 설계 (Supabase)

Supabase Auth의 이메일 가입 기능 및 세부 스키마 설정을 반영한 상세 데이터베이스 설계입니다.

### 2.1. `profiles` (사용자 프로필)
Supabase의 관리형 인증 테이블인 `auth.users`와 1:1 관계를 맺으며, 추가적인 서비스 사용자 프로필 정보를 관리합니다.

| Column Name | Data Type | Default Value | Primary Key | Is Nullable | Is Unique | References & Description |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | *None* | ✅ | ❌ | ✅ | `auth.users(id)` ON DELETE CASCADE (가입 유저 ID) |
| `nickname` | `text` | `'새로운 새싹'` | ❌ | ❌ | ❌ | 사용자 닉네임 (기본값: '새로운 새싹') |
| `created_at` | `timestamp with time zone` | `now()` | ❌ | ❌ | ❌ | 프로필 생성 일시 |

> [!TIP]
> **Supabase Auth 연동 자동화 트리거 (PostgreSQL)**
> Supabase Auth에 이메일 계정이 생성될 때, `public.profiles` 테이블에 프로필이 자동으로 생성되도록 아래 트리거 SQL을 설정할 수 있습니다.
> ```sql
> -- 신규 가입 시 프로필 테이블 자동 삽입 함수
> create or replace function public.handle_new_user()
> returns trigger as $$
> begin
>   insert into public.profiles (id, nickname)
>   values (
>     new.id, 
>     coalesce(new.raw_user_meta_data->>'nickname', '새로운 새싹')
>   );
>   return new;
> end;
> $$ language plpgsql security definer;
> 
> -- auth.users 테이블에 insert 발생 시 트리거 실행
> create or replace trigger on_auth_user_created
>   after insert on auth.users
>   for each row execute procedure public.handle_new_user();
> ```

---

### 2.2. `todos` (할 일 및 달력)
각 사용자의 일자별 할 일을 기록하고 달력 컴포넌트와 연동됩니다.

| Column Name | Data Type | Default Value | Primary Key | Is Nullable | Is Unique | References & Description |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | `gen_random_uuid()` | ✅ | ❌ | ✅ | 고유 할 일 ID |
| `user_id` | `uuid` | `auth.uid()` | ❌ | ❌ | ❌ | `auth.users(id)` ON DELETE CASCADE (작성자 ID) |
| `title` | `text` | *None* | ❌ | ❌ | ❌ | 할 일 내용 (예: '물 주기') |
| `is_completed`| `boolean` | `false` | ❌ | ❌ | ❌ | 완료 여부 |
| `target_date` | `date` | `CURRENT_DATE` | ❌ | ❌ | ❌ | 할 일을 수행할 지정 날짜 (예: 2026-07-25) |
| `created_at` | `timestamp with time zone` | `now()` | ❌ | ❌ | ❌ | 할 일 생성 일시 |

---

### 2.3. `plants` (인벤토리 및 수집한 식물)
사용자가 소유한 식물의 성장 상태(레벨, 경험치) 및 수집 이력을 관리합니다.

| Column Name | Data Type | Default Value | Primary Key | Is Nullable | Is Unique | References & Description |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | `gen_random_uuid()` | ✅ | ❌ | ✅ | 고유 식물 ID |
| `user_id` | `uuid` | `auth.uid()` | ❌ | ❌ | ❌ | `auth.users(id)` ON DELETE CASCADE (소유자 ID) |
| `plant_type` | `text` | `'sprout'` | ❌ | ❌ | ❌ | 식물 종류 식별자 (예: 'sprout', 'dandelion') |
| `level` | `integer` | `1` | ❌ | ❌ | ❌ | 식물 현재 레벨 (기본값: 1) |
| `current_exp` | `integer` | `0` | ❌ | ❌ | ❌ | 현재 레벨에서의 누적 경험치 (기본값: 0) |
| `status` | `text` | `'growing'` | ❌ | ❌ | ❌ | 상태 구분 (`growing`: 성장중, `collected`: 수집완료) |
| `created_at` | `timestamp with time zone` | `now()` | ❌ | ❌ | ❌ | 획득/생성 일시 |

---

## 3. 프로젝트 폴더 구조 설계

프론트엔드와 백엔드를 명확히 분리하기 위한 모노레포(Monorepo) 스타일의 간단한 구조입니다.

```text
하루한잎/
├── frontend/               # 기존 HTML, CSS, JS/TS 에셋
│   ├── index.html
│   ├── inventory.html
│   ├── mypage.html
│   ├── login.html
│   ├── common.css
│   ├── home.css
│   └── inventory.css
│
├── backend/                # 신규 Node.js 백엔드
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts          # Express 앱 진입점
│       ├── config/         # Supabase 연결 설정 등
│       ├── routes/         # 라우터 (API 경로 매핑)
│       ├── controllers/    # 요청(Request) / 응답(Response) 처리
│       ├── services/       # 비즈니스 로직 및 Supabase DB 접근
│       └── middlewares/    # 인증, 에러 처리 미들웨어
│
└── .gemini/
```

---

## 4. 핵심 라우팅 및 REST API 설계 (Node.js)

### 4.1. Pages (정적 HTML 페이지 라우팅)
사용자가 브라우저 주소창에 특정 경로를 입력했을 때 그에 알맞은 HTML 파일을 반환하는 페이지 라우팅 설계입니다.

* **정적 에셋 서빙 설정**
  `common.css`, `navigation.js` 등 공통 에셋 및 이미지 파일들이 올바르게 렌더링될 수 있도록 `frontend/` 디렉토리를 Express static 폴더로 서빙하도록 설정합니다.
  ```typescript
  app.use(express.static(path.join(__dirname, '../../frontend')));
  ```

* **상세 페이지 라우팅 경로**
  | HTTP Method | URL Path | Response File | Description |
  | :--- | :--- | :--- | :--- |
  | `GET` | `/` | `index.html` | 홈 화면 (달력 및 할 일 목록 페이지) |
  | `GET` | `/login` | `login.html` | 로그인 화면 |
  | `GET` | `/register` | `register.html` | 회원가입 화면 |
  | `GET` | `/inventory` | `inventory.html` | 인벤토리 화면 (도감 페이지) |
  | `GET` | `/mypage` | `mypage.html` | 마이페이지 화면 |

---

### 4.2. API (데이터 처리용 REST API 설계)

#### Auth (인증)
* `POST /api/auth/register` : 회원가입
* `POST /api/auth/login` : 로그인 및 세션(토큰) 발급

#### Todos (할 일)
* `GET /api/todos?date=YYYY-MM-DD` : 특정 날짜의 할 일 목록 조회
* `POST /api/todos` : 새로운 할 일 추가
* `PATCH /api/todos/:id/toggle` : 할 일 완료/미완료 토글 (완료 시 서버 측에서 식물 경험치 추가 로직 트리거)
* `DELETE /api/todos/:id` : 할 일 삭제

#### Plants (식물 및 인벤토리)
* `GET /api/plants/current` : 현재 키우고 있는 식물 정보(레벨, EXP) 조회
* `GET /api/plants/collection` : 도감(수집된 식물 목록) 조회

---

## 5. 단계별 실행 계획 (Execution Plan)

> **사용자 승인(Proceed) 후 다음 순서에 따라 단계적으로 개발을 진행할 예정입니다.**

* **Phase 1: 백엔드 초기 세팅**
  * `backend` 폴더 생성 및 Node.js + Express + TypeScript 환경 초기화.
  * 기존 UI 파일들을 `frontend` 폴더로 정리.

* **Phase 2: Supabase 연동**
  * Supabase 프로젝트 생성 및 클라이언트(`@supabase/supabase-js`) 연결 로직 작성.
  * 데이터베이스 스키마(테이블) 생성 스크립트 또는 UI를 통한 테이블 구축.

* **Phase 3: API 개발**
  * Auth, Todos, Plants에 대한 Express 라우터 및 컨트롤러/서비스 로직 작성.
  * 할 일 달성 시 식물 경험치가 오르는 비즈니스 로직 구현.

* **Phase 4: 프론트엔드 연동**
  * `index.html`, `inventory.html` 등 프론트엔드에서 Javascript의 `fetch` API를 사용하여 백엔드 서버와 통신하도록 업데이트.
  * 로컬 목업(Mock) 데이터에서 실제 DB 데이터 기반으로 화면 전환.
