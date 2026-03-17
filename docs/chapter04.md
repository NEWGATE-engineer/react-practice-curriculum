# 第4章: ルーティングとレイアウト

## この章のゴール
- React Router v6でSPAのページ遷移を実装する
- ネストされたルートとレイアウトルートを理解する
- 動的ルーティング（パラメータ付きURL）を使いこなす
- TaskFlowにページ遷移を導入する

## 完成イメージ
ダッシュボード、タスク一覧、タスク詳細、プロジェクト一覧の各ページが
URLで切り替わるSPAを構築する。

## 作業順序

1. `react-router-dom` をインストール（4-1）
2. `src/components/feedback/NotFoundPage.tsx` 作成 — 404ページ（依存なし）（4-6）
3. `src/features/dashboard/components/DashboardPage.tsx` 作成 — ダッシュボードページ（依存なし）
4. `src/features/tasks/components/TaskDetailPage.tsx` 作成 — タスク詳細ページ（依存なし）（4-4）
5. `src/features/projects/components/ProjectListPage.tsx` 作成 — プロジェクト一覧ページ（依存なし）
6. `src/components/layout/Sidebar.tsx` 更新 — `<a>` を `<NavLink>` に変更（4-3）
7. `src/components/layout/RootLayout.tsx` 作成 — Outlet使用 ※Header, Sidebarに依存（4-2）
8. `src/features/tasks/components/TaskLayout.tsx` 作成 — タスク共通レイアウト（4-5）
9. `src/app/router.tsx` 作成 — ルーティング定義 ※上記すべてのページ・レイアウトに依存（4-2）
10. `src/app/App.tsx` 更新 — `RouterProvider` に変更 ※router.tsxに依存（4-2）

---

## 4-1. SPAとルーティング

### 従来のWebアプリ（Laravel）との違い

```
Laravel（MPA: Multi Page Application）:
  /tasks     → web.phpでルート定義 → Controller → Bladeビュー → HTMLをサーバーが返す
  /tasks/1   → 毎回サーバーにリクエスト → 新しいHTMLページ全体を読み込む

React SPA（Single Page Application）:
  /tasks     → ブラウザ側でURLを見て表示するコンポーネントを切り替える
  /tasks/1   → サーバーにリクエストしない → JavaScriptでコンポーネントを差し替え
```

SPAの利点: ページ全体のリロードが不要なので、高速でスムーズなUX。

### インストール

```bash
npm install react-router-dom
```

---

## 4-2. 基本的なルーティング設定

### ページコンポーネントの作成

ルーターで使うページコンポーネントを先に作成しておきます。

```tsx
// src/features/dashboard/components/DashboardPage.tsx
// 第1章のApp.tsxに書いていたダッシュボードUIを独立したページコンポーネントに抽出
export function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">ダッシュボード</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">未完了タスク</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">進行中</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">5</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">完了</p>
          <p className="text-3xl font-bold text-green-600 mt-1">24</p>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/features/projects/components/ProjectListPage.tsx
// プロジェクト一覧ページ（この時点ではプレースホルダー）
export function ProjectListPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">プロジェクト一覧</h2>
      <p className="text-gray-500">プロジェクト機能は今後の章で実装します。</p>
    </div>
  );
}
```

> **ポイント:** 第1章ではApp.tsxにダッシュボードのUIを直接書いていましたが、
> ルーティング導入に伴い、各ページを独立したコンポーネントに分離します。
> これはLaravelでルートごとにControllerとViewを分けるのと同じ考え方です。

### ルーター定義

```tsx
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { TaskListPage } from '@/features/tasks/components/TaskListPage';
import { TaskDetailPage } from '@/features/tasks/components/TaskDetailPage';
import { ProjectListPage } from '@/features/projects/components/ProjectListPage';
import { NotFoundPage } from '@/components/feedback/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,  // 共通レイアウト
    children: [
      { index: true, element: <DashboardPage /> },         // /
      { path: 'tasks', element: <TaskListPage /> },        // /tasks
      { path: 'tasks/:taskId', element: <TaskDetailPage /> }, // /tasks/123
      { path: 'projects', element: <ProjectListPage /> },  // /projects
      { path: '*', element: <NotFoundPage /> },            // 404ページ
    ],
  },
]);
```

> **Laravelのルーティングとの対比:**
> ```php
> // Laravel: web.php
> Route::get('/', [DashboardController::class, 'index']);
> Route::get('/tasks', [TaskController::class, 'index']);
> Route::get('/tasks/{task}', [TaskController::class, 'show']);
> ```
> 考え方はほぼ同じです。定義する場所がサーバー側からクライアント側に移っただけ。

### Appにルーターを適用

```tsx
// src/app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
  return <RouterProvider router={router} />;
}
```

### レイアウトコンポーネント（Outlet）

```tsx
// src/components/layout/RootLayout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function RootLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Outlet: 子ルートのコンポーネントがここに表示される */}
          {/* Bladeの @yield('content') に相当 */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## 4-3. ナビゲーション

### Link と NavLink

```tsx
// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'ダッシュボード', to: '/' },
  { label: 'タスク', to: '/tasks' },
  { label: 'プロジェクト', to: '/projects' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <nav>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              {/* NavLinkは現在のURLとマッチする場合にアクティブスタイルを適用 */}
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

> **aタグとの違い:**
> - `<a href="/tasks">` → ページ全体がリロードされる
> - `<Link to="/tasks">` → JavaScriptでURLを変更、コンポーネントのみ切り替え（SPA）

### プログラムによるナビゲーション

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useNavigate } from 'react-router-dom';

function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Laravelの return redirect('/tasks/1'); に相当
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {task.title}
    </div>
  );
}
```

---

## 4-4. 動的ルーティングとパラメータ

### URLパラメータの取得

```tsx
// src/features/tasks/components/TaskDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';

export function TaskDetailPage() {
  // URLの :taskId 部分を取得
  // /tasks/abc123 → taskId = 'abc123'
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  // 後の章でAPIから取得するようにリファクタリングします
  // ここではダミーデータで表示

  return (
    <div>
      <button
        onClick={() => navigate('/tasks')}
        className="text-blue-600 hover:text-blue-800 mb-4"
      >
        ← タスク一覧に戻る
      </button>
      <h2 className="text-2xl font-bold">タスク詳細: {taskId}</h2>
      {/* 詳細内容 */}
    </div>
  );
}
```

### クエリパラメータ

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useSearchParams } from 'react-router-dom';

function TaskListPage() {
  // URLの ?status=todo&q=検索 部分を管理
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const query = searchParams.get('q') || '';

  const handleFilterChange = (newStatus: string) => {
    setSearchParams(prev => {
      prev.set('status', newStatus);
      return prev;
    });
    // URL が /tasks?status=in_progress&q=検索 に変わる
  };

  return (
    <div>
      <p>フィルタ: {status}, 検索: {query}</p>
      {/* ... */}
    </div>
  );
}
```

> **Laravelとの対比:**
> ```php
> // Laravel: $request->query('status') に相当
> $status = $request->query('status', 'all');
> ```

---

## 4-5. ネストされたルートとレイアウト

4-2のフラットなルーティングを、ネスト構造にリファクタリングします。
タスク関連のページにはTaskLayoutという共通レイアウトを追加します:

```tsx
// src/app/router.tsx（ネスト版に更新）
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { TaskListPage } from '@/features/tasks/components/TaskListPage';
import { TaskDetailPage } from '@/features/tasks/components/TaskDetailPage';
import { TaskLayout } from '@/features/tasks/components/TaskLayout';
import { ProjectListPage } from '@/features/projects/components/ProjectListPage';
import { NotFoundPage } from '@/components/feedback/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'tasks',
        // タスク関連ページ共通のレイアウト
        element: <TaskLayout />,
        children: [
          { index: true, element: <TaskListPage /> },       // /tasks
          { path: ':taskId', element: <TaskDetailPage /> },  // /tasks/123
        ],
      },
      { path: 'projects', element: <ProjectListPage /> },   // /projects
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

```tsx
// src/features/tasks/components/TaskLayout.tsx
import { Outlet } from 'react-router-dom';

export function TaskLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          タスクの作成・管理を行います
        </p>
      </div>
      {/* 子ルートの内容がここに表示される */}
      <Outlet />
    </div>
  );
}
```

---

## 4-6. 404ページとエラーハンドリング

```tsx
// src/components/feedback/NotFoundPage.tsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500 mt-4">ページが見つかりません</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ダッシュボードに戻る
      </Link>
    </div>
  );
}
```

---

## 章末チェックリスト

- [ ] React Routerでルート定義ができる
- [ ] Link/NavLinkでページ遷移ができる（aタグとの違いを理解）
- [ ] useNavigateでプログラム的にページ遷移ができる
- [ ] useParamsでURLパラメータを取得できる
- [ ] useSearchParamsでクエリパラメータを管理できる
- [ ] Outletを使ったネストルート/レイアウトルートを理解している
- [ ] 404ページを設定できる
- [ ] TaskFlowでダッシュボード/タスク一覧/タスク詳細のページ遷移が動作する
