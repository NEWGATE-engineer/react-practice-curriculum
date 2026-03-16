# 第10章: 認証とルートガード

## この章のゴール
- 認証（ログイン・ログアウト・ユーザー登録）を実装する
- Protected Route（認証が必要なルート）を設定する
- トークンベース認証の仕組みを理解する
- Laravel Sanctumとの連携を想定した設計にする

## 完成イメージ
ログイン/登録画面、認証済みユーザーのみアクセス可能なルートが動作する。

## 作業順序

1. `src/features/auth/types/index.ts` 作成 — 認証関連の型定義（依存なし）（10-2）
2. `src/features/auth/stores/auth-store.ts` 作成 — Zustand + persistで認証状態管理 ※型定義に依存（10-3）
3. `src/features/auth/api/auth-api.ts` 作成 — モック認証API ※型定義に依存（10-4）
4. `src/features/auth/hooks/useAuth.ts` 作成 — ログイン/登録/ログアウト用Mutationフック ※auth-api, auth-storeに依存（10-4）
5. `src/features/auth/components/LoginForm.tsx` 作成 ※useAuth, FormField, Inputに依存（10-5）
6. `src/features/auth/components/RegisterForm.tsx` 作成 ※useAuth, FormField, Inputに依存
7. `src/features/auth/components/ProtectedRoute.tsx` 作成 ※auth-storeに依存（10-6）
8. `src/features/auth/components/GuestRoute.tsx` 作成 ※auth-storeに依存（10-6）
9. `src/app/router.tsx` 更新 — ProtectedRoute/GuestRouteでルートを分離 ※上記すべてに依存（10-6）
10. `src/components/layout/Header.tsx` 更新 — ユーザー名とログアウトボタンを表示 ※auth-store, useAuthに依存（10-7）

---

## 10-1. 認証フローの全体像

### Laravel Sanctum との連携を想定

```
1. ログイン:
   React → POST /api/login (email, password) → Laravel
   Laravel → バリデーション → Sanctumトークン発行 → JSON返却
   React → トークンをlocalStorageに保存 → ダッシュボードへ遷移

2. 認証済みリクエスト:
   React → Axiosインターセプターがトークンをヘッダーに付与
   → GET /api/tasks → Laravel (authミドルウェア) → JSON返却

3. ログアウト:
   React → POST /api/logout → Laravel → トークン無効化
   React → トークン削除 → ログインページへ遷移
```

> **Laravelの認証との違い:**
> Laravel Bladeではセッションベース認証（Cookie）が主流でしたが、
> SPA + APIではトークンベース認証（Bearer Token）を使います。
> Laravel Sanctumはどちらにも対応しています。

---

## 10-2. 認証の型定義

```tsx
// src/features/auth/types/index.ts
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};
```

---

## 10-3. 認証ストア（Zustand）

```tsx
// src/features/auth/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth-token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 10-4. 認証API

```tsx
// src/features/auth/api/auth-api.ts
import { apiClient } from '@/lib/api-client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

// モック版（本番ではapiClientを使う）
const mockUsers = [
  {
    id: '1',
    name: 'テストユーザー',
    email: 'test@example.com',
    password: 'password123',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    await delay(500);
    const user = mockUsers.find(
      u => u.email === data.email && u.password === data.password
    );
    if (!user) throw new Error('メールアドレスまたはパスワードが正しくありません');

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: `mock-token-${Date.now()}`,
    };
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    await delay(500);
    if (mockUsers.some(u => u.email === data.email)) {
      throw new Error('このメールアドレスは既に使用されています');
    }

    const newUser = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
    };

    return {
      user: newUser,
      token: `mock-token-${Date.now()}`,
    };
  },

  async logout(): Promise<void> {
    await delay(200);
  },

  async getMe(): Promise<User> {
    await delay(300);
    // 実際はトークンからユーザーを特定
    return {
      id: '1',
      name: 'テストユーザー',
      email: 'test@example.com',
      createdAt: '2025-01-01T00:00:00Z',
    };
  },
};
```

### 認証用 Mutation フック

```tsx
// src/features/auth/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '../stores/auth-store';
import { useToastStore } from '@/stores/toast-store';

export function useLogin() {
  const setAuth = useAuthStore(state => state.setAuth);
  const addToast = useToastStore(state => state.addToast);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      addToast('ログインしました', 'success');
      navigate('/');
    },
    onError: (error: Error) => {
      addToast(error.message, 'error');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore(state => state.setAuth);
  const addToast = useToastStore(state => state.addToast);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      addToast('アカウントを作成しました', 'success');
      navigate('/');
    },
    onError: (error: Error) => {
      addToast(error.message, 'error');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore(state => state.logout);
  const addToast = useToastStore(state => state.addToast);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      addToast('ログアウトしました', 'info');
      navigate('/login');
    },
  });
}
```

---

## 10-5. ログインフォーム

```tsx
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上です'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">TaskFlow にログイン</h1>

        <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-4">
          <FormField label="メールアドレス" error={errors.email}>
            <Input type="email" {...register('email')} hasError={!!errors.email} />
          </FormField>

          <FormField label="パスワード" error={errors.password}>
            <Input type="password" {...register('password')} hasError={!!errors.password} />
          </FormField>

          <Button variant="primary" disabled={login.isPending}>
            {login.isPending ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          アカウントをお持ちでない方は
          <Link to="/register" className="text-blue-600 hover:underline ml-1">
            新規登録
          </Link>
        </p>

        {/* テスト用ヒント */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p>テスト用: test@example.com / password123</p>
        </div>
      </div>
    </div>
  );
}
```

### ユーザー登録フォーム

LoginFormとほぼ同じ構成で、名前とパスワード確認フィールドを追加します:

```tsx
// src/features/auth/components/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const registerSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上です'),
  passwordConfirmation: z.string().min(8, 'パスワード確認は必須です'),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirmation'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">アカウント作成</h1>

        <form
          onSubmit={handleSubmit((data) => register_.mutate(data))}
          className="space-y-4"
        >
          <FormField label="名前" error={errors.name}>
            <Input {...register('name')} hasError={!!errors.name} />
          </FormField>

          <FormField label="メールアドレス" error={errors.email}>
            <Input type="email" {...register('email')} hasError={!!errors.email} />
          </FormField>

          <FormField label="パスワード" error={errors.password}>
            <Input type="password" {...register('password')} hasError={!!errors.password} />
          </FormField>

          <FormField label="パスワード確認" error={errors.passwordConfirmation}>
            <Input
              type="password"
              {...register('passwordConfirmation')}
              hasError={!!errors.passwordConfirmation}
            />
          </FormField>

          <Button variant="primary" disabled={register_.isPending}>
            {register_.isPending ? '登録中...' : 'アカウントを作成'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          すでにアカウントをお持ちの方は
          <Link to="/login" className="text-blue-600 hover:underline ml-1">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 10-6. Protected Route（ルートガード）

### LaravelのMiddlewareとの対比

```php
// Laravel: auth ミドルウェア
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/tasks', [TaskController::class, 'index']);
});

// 未認証 → /login にリダイレクト
```

### React版

```tsx
// src/features/auth/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 未認証 → ログインページへリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 認証済み → 子ルートを表示
  return <Outlet />;
}
```

```tsx
// src/features/auth/components/GuestRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

export function GuestRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 認証済みならダッシュボードへ（ログインページに戻さない）
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
```

### ルーター設定

```tsx
// src/app/router.tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const router = createBrowserRouter([
  // ゲスト用ルート（未認証のみアクセス可能）
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginForm /> },
      { path: '/register', element: <RegisterForm /> },
    ],
  },

  // 認証済みルート（ログイン必須）
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'tasks', element: <TaskListPage /> },
          { path: 'tasks/:taskId', element: <TaskDetailPage /> },
          { path: 'projects', element: <ProjectListPage /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
```

---

## 10-7. ヘッダーにユーザー情報を表示

```tsx
// src/components/layout/Header.tsx
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/useAuth';

export function Header() {
  const user = useAuthStore(state => state.user);
  const logout = useLogout();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={() => logout.mutate()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 章末チェックリスト

- [ ] トークンベース認証の仕組みを理解している
- [ ] 認証ストア（Zustand + persist）でログイン状態を管理できる
- [ ] ログイン・ユーザー登録フォームが動作する
- [ ] Protected Routeで認証が必要なルートを保護できる
- [ ] GuestRouteでログイン済みユーザーをリダイレクトできる
- [ ] Axiosインターセプターでトークンを自動付与できる
- [ ] ヘッダーにユーザー名とログアウトボタンを表示できる
- [ ] Laravel Sanctumとの連携方法を理解している
