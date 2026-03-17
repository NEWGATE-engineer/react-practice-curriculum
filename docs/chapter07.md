# 第7章: グローバル状態管理

## この章のゴール
- useContext で値の受け渡しパターンを理解する
- useReducer で複雑な状態管理を学ぶ
- Zustand で実践的なグローバル状態管理を実装する
- 「サーバー状態」と「クライアント状態」の違いを理解する

## 完成イメージ
テーマ切り替え、サイドバー開閉、トースト通知をグローバル状態で管理する。

## 作業順序

1. `zustand` をインストール（7-4）
2. `src/contexts/ThemeContext.tsx` 作成 — useContext の学習用（依存なし）（7-2）
3. `src/features/tasks/stores/task-filter-store.ts` 作成 — Zustandストア（依存なし）（7-4）
4. `src/stores/ui-store.ts` 作成 — サイドバー開閉状態（依存なし）（7-5）
5. `src/stores/toast-store.ts` 作成 — トースト通知ストア（依存なし）（7-5）
6. `src/components/feedback/ToastContainer.tsx` 作成 ※toast-storeに依存（7-5）
7. `src/components/layout/Sidebar.tsx` 更新 — useUIStoreで開閉管理 ※ui-storeに依存
8. `src/components/layout/RootLayout.tsx` 更新 — ToastContainerを配置 ※ToastContainerに依存
9. `src/features/tasks/components/TaskFilterTabs.tsx` 更新 — Zustandストアに切り替え ※task-filter-storeに依存
10. `src/stores/settings-store.ts` 作成 — persist ミドルウェアでテーマ永続化（7-6）

---

## 7-1. 状態の種類を整理する

### サーバー状態 vs クライアント状態

```
サーバー状態（TanStack Query で管理 — 第6章）:
  - タスク一覧、ユーザー情報、プロジェクトデータ
  - APIから取得するデータ
  - キャッシュ・再取得・同期が必要

クライアント状態（Zustand / Context で管理 — この章）:
  - テーマ（ダーク/ライト）
  - サイドバーの開閉
  - モーダルの表示状態
  - トースト通知
  - UIの一時的な状態
```

> **重要な設計指針:**
> 「APIから来るデータ」は TanStack Query、
> 「UIの状態」は Zustand / Context で管理する。
> この分離が現場でのベストプラクティスです。

---

## 7-2. useContext — Propsバケツリレー問題の解決

### Propsバケツリレーとは

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// NG: テーマをルートから末端まで延々とPropsで渡す
function App() {
  const [theme, setTheme] = useState('light');
  return <Layout theme={theme}><Page theme={theme}><Card theme={theme}><Button theme={theme} /></Card></Page></Layout>;
}
// 5階層あったら5回Propsを書く... Bladeの変数受け渡しと同じ問題
```

### Context で解決

```tsx
// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState } from 'react';

// 1. Contextの型定義
type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

// 2. Contextの作成
const ThemeContext = createContext<ThemeContextValue | null>(null);

// 3. Providerコンポーネント
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 4. カスタムフック（Contextを安全に使うため）
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// 使用側（何階層でもPropsなしでアクセス可能）
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 ダークモード' : '☀️ ライトモード'}
    </button>
  );
}
```

> **Laravelとの対比:**
> Context は Laravel の Service Container / サービスプロバイダに近い概念。
> アプリ全体で共有したい値を「注入」する仕組みです。

### Contextの限界

- Providerの値が変わると、**配下の全コンポーネントが再レンダリング**される
- 複雑な状態管理には向かない
- → シンプルな値の共有（テーマ、ロケール等）に使い、
  複雑な状態管理には **Zustand** を使う

---

## 7-3. useReducer — 複雑な状態遷移

### useStateの限界

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// stateが増えると管理が大変
const [isOpen, setIsOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState(null);

// 状態の遷移パターンが複雑になる
const fetchData = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await api.get();
    setData(result);
    setIsLoading(false);
  } catch (e) {
    setError(e.message);
    setIsLoading(false);
  }
};
```

### useReducer で状態遷移を明示的に管理

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useReducer } from 'react';

// Laravelの Enum / 定数管理 に近い考え方
type State = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  data: Task[] | null;
};

// アクションの定義（「何が起きたか」を表す）
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Task[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'TOGGLE_MODAL' };

// Reducer関数（「状態遷移のルール」を定義）
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'TOGGLE_MODAL':
      return { ...state, isOpen: !state.isOpen };
    default:
      return state;
  }
}

// 使用
function TaskPage() {
  const [state, dispatch] = useReducer(reducer, {
    isOpen: false,
    isLoading: false,
    error: null,
    data: null,
  });

  const fetchTasks = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const tasks = await api.getTasks();
      dispatch({ type: 'FETCH_SUCCESS', payload: tasks });
    } catch (e) {
      dispatch({ type: 'FETCH_ERROR', payload: e.message });
    }
  };
}
```

> **useReducer は Reduxの原型:**
> Redux（大規模な状態管理ライブラリ）の考え方を学ぶ基礎になります。
> ただし現場では Redux よりも軽量な **Zustand** が主流です。

---

## 7-4. Zustand — 現場で使われる状態管理

### なぜ Zustand？

| 特徴 | Redux | Zustand | Context |
|------|-------|---------|---------|
| ボイラープレート | 多い | 少ない | 中程度 |
| 学習コスト | 高い | 低い | 低い |
| パフォーマンス | 良い | 良い | 悪い（再レンダリング多発） |
| DevTools | あり | あり | なし |
| 現場の採用率 | 減少傾向 | 増加傾向 | 限定的 |

### インストール

```bash
npm install zustand
```

### 基本的なストア

```tsx
// src/features/tasks/stores/task-filter-store.ts
import { create } from 'zustand';
import type { TaskStatus } from '../types';

type FilterOption = TaskStatus | 'all';

type TaskFilterState = {
  // 状態
  filter: FilterOption;
  searchQuery: string;

  // アクション
  setFilter: (filter: FilterOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
};

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  // 初期状態
  filter: 'all',
  searchQuery: '',

  // アクション（setでstateを更新）
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ filter: 'all', searchQuery: '' }),
}));
```

### コンポーネントでの使用

```tsx
// ※ 概念説明用コード（ファイルには書きません）
function TaskFilterTabs() {
  // 必要な値だけを取り出す（セレクター）
  // → この値が変わった時だけ再レンダリング
  const filter = useTaskFilterStore(state => state.filter);
  const setFilter = useTaskFilterStore(state => state.setFilter);

  return (
    <div className="flex gap-1">
      {['all', 'todo', 'in_progress', 'done'].map(option => (
        <button
          key={option}
          onClick={() => setFilter(option as FilterOption)}
          className={filter === option ? 'bg-blue-500 text-white' : 'bg-gray-100'}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TaskSearchBar() {
  const searchQuery = useTaskFilterStore(state => state.searchQuery);
  const setSearchQuery = useTaskFilterStore(state => state.setSearchQuery);

  return (
    <input
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="検索..."
    />
  );
}
```

> **重要: セレクターパターン**
> `useTaskFilterStore(state => state.filter)` のように
> 必要な値だけを取り出すことで、不要な再レンダリングを防ぎます。

---

## 7-5. 実践: UIステートストア

### サイドバーの開閉状態

```tsx
// src/stores/ui-store.ts
import { create } from 'zustand';

type UIState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
```

### トースト通知システム

```tsx
// src/stores/toast-store.ts
import { create } from 'zustand';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type ToastState = {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type) => {
    const id = Date.now().toString();
    set(state => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // 3秒後に自動で消す
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));
```

```tsx
// src/components/feedback/ToastContainer.tsx
import { useToastStore } from '@/stores/toast-store';

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-white/80 hover:text-white">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### API操作とトーストの連携

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useCreateTask } from '@/features/tasks/api/task-mutations';
import { useToastStore } from '@/stores/toast-store';
import type { Task } from '@/features/tasks/types';

// タスク作成時にトースト通知を出す
function useCreateTaskWithToast() {
  const createTask = useCreateTask();
  const addToast = useToastStore(state => state.addToast);

  return {
    ...createTask,
    mutate: (data: Omit<Task, 'id' | 'createdAt'>) => {
      createTask.mutate(data, {
        onSuccess: () => addToast('タスクを作成しました', 'success'),
        onError: () => addToast('タスクの作成に失敗しました', 'error'),
      });
    },
  };
}
```

### Sidebarの更新（useUIStoreで開閉管理）

第4章で作成したSidebarに、Zustandストアでの開閉管理を追加します:

```tsx
// src/components/layout/Sidebar.tsx（更新）
import { NavLink } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { label: 'ダッシュボード', to: '/' },
  { label: 'タスク', to: '/tasks' },
  { label: 'プロジェクト', to: '/projects' },
];

export function Sidebar() {
  const isSidebarOpen = useUIStore(state => state.isSidebarOpen);

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <nav>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
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

### RootLayoutの更新（ToastContainerを配置）

```tsx
// src/components/layout/RootLayout.tsx（更新）
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/feedback/ToastContainer';

export function RootLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
```

### TaskFilterTabsの更新（Zustandストアに切り替え）

第3章のprops経由から、Zustandストアで直接状態管理するように変更します:

```tsx
// src/features/tasks/components/TaskFilterTabs.tsx（更新）
import { useTaskFilterStore } from '../stores/task-filter-store';
import type { TaskStatus } from '../types';

type FilterOption = TaskStatus | 'all';

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
];

type TaskFilterTabsProps = {
  counts: Record<FilterOption, number>;
};

export function TaskFilterTabs({ counts }: TaskFilterTabsProps) {
  const filter = useTaskFilterStore(state => state.filter);
  const setFilter = useTaskFilterStore(state => state.setFilter);

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setFilter(option.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.label}
          <span className="ml-1 text-xs text-gray-400">
            ({counts[option.value]})
          </span>
        </button>
      ))}
    </div>
  );
}
```

---

## 7-6. Zustand の永続化（persist）

```tsx
// src/stores/settings-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

type SettingsState = {
  theme: Theme;
  language: string;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: string) => void;
};

// localStorageに自動保存・復元
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ja',
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'taskflow-settings', // localStorageのキー名
    }
  )
);
```

---

## 章末チェックリスト

- [ ] サーバー状態とクライアント状態の違いを理解している
- [ ] useContextでPropsバケツリレーを回避できる
- [ ] useReducerで複雑な状態遷移を管理できる
- [ ] Zustandでストアを作成し、コンポーネントから利用できる
- [ ] セレクターパターンで必要な値だけ取得できる
- [ ] UIストア（サイドバー、トースト）が動作する
- [ ] persistミドルウェアで状態を永続化できる
- [ ] TanStack Query（サーバー状態）とZustand（クライアント状態）を使い分けられる
