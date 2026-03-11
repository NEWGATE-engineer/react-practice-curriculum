# 第6章: API連携とサーバー状態管理

## この章のゴール
- Axiosでの HTTP通信の基本を理解する
- TanStack Query（React Query）でサーバー状態を効率的に管理する
- CRUD操作（Create, Read, Update, Delete）を実装する
- モックAPIを使って開発を進め、後でLaravel APIに切り替える準備をする

## 完成イメージ
タスクのCRUD操作がAPIを通じて動作する。読み込み中・エラー状態の表示も含む。

## 作業順序

1. `axios` をインストール（6-2）
2. `src/lib/api-client.ts` 作成 — Axiosインスタンス + インターセプター（依存なし）（6-2）
3. `src/features/tasks/types/index.ts` 更新 — Task型にpriority, dueDateを追加（依存なし）
4. `src/mocks/tasks.ts` 作成 — モックデータとモックAPI関数 ※型定義に依存（6-3）
5. `@tanstack/react-query`, `@tanstack/react-query-devtools` をインストール（6-4）
6. `src/lib/query-client.ts` 作成 — QueryClient設定（依存なし）（6-4）
7. `src/app/providers.tsx` 作成 — QueryClientProvider ※query-clientに依存（6-4）
8. `src/app/App.tsx` 更新 — Providersで囲む ※providers.tsxに依存（6-4）
9. `src/features/tasks/api/task-queries.ts` 作成 — useQuery フック ※モックAPIに依存（6-5）
10. `src/features/tasks/api/task-mutations.ts` 作成 — useMutation フック ※モックAPI, queryKeysに依存（6-6）
11. `src/features/tasks/components/TaskListPage.tsx` 更新 — useQueryでデータ取得に切り替え（6-5）
12. `src/features/tasks/api/task-api.ts` 作成 — 本番API関数（将来のLaravel連携用）（6-8）

---

## 6-1. フロントエンドとバックエンドの分離

### Laravel Blade（従来）vs React + API（現代）

```
従来（Laravel Blade + jQuery）:
  ブラウザ → Laravel → Controller → Blade → HTML返却
  jQuery$.ajax() → Laravel API → JSON返却 → jQueryでDOM操作

現代（React + Laravel API）:
  ブラウザ → React（SPA） → Axios → Laravel API → JSON返却
  TanStack Queryがキャッシュ・再取得・エラー処理を自動管理
```

LaravelをAPI専用にして（`api.php` のルート）、
フロントエンドをReactで構築するのが現場の主流です。

---

## 6-2. Axiosのセットアップ

### インストール

```bash
npm install axios
```

### APIクライアントの作成

```tsx
// src/lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
});

// リクエストインターセプター（認証トークンの付与）
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター（共通エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラー → ログインページへ（第10章で実装）
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

> **Laravelのミドルウェアとの対比:**
> Axiosのインターセプターは、Laravelのミドルウェアに相当します。
> リクエスト前（Bearerトークン付与）とレスポンス後（エラーハンドリング）に
> 共通処理を挟めます。

---

## 6-3. モックAPIの作成

実際のLaravel APIがなくても開発を進められるように、
モックデータとモックAPI関数を用意します:

```tsx
// src/mocks/tasks.ts
import type { Task, TaskStatus } from '@/features/tasks/types';

// モックデータ
let mockTasks: Task[] = [
  {
    id: '1',
    title: 'プロジェクト計画書を作成',
    description: 'スコープと期限を決める',
    status: 'todo',
    priority: 'high',
    dueDate: '2025-02-01',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'デザインカンプを確認',
    description: 'Figmaで共有されたデザインをレビュー',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2025-01-20',
    createdAt: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    title: '開発環境構築',
    description: 'Docker + Viteの環境を整備',
    status: 'done',
    priority: 'low',
    dueDate: null,
    createdAt: '2025-01-03T00:00:00Z',
  },
];

// API遅延をシミュレーション
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// モックAPIの実装（Laravelの Controller に相当）
export const mockTaskApi = {
  // GET /api/tasks（index）
  async getAll(): Promise<Task[]> {
    await delay(500);
    return [...mockTasks];
  },

  // GET /api/tasks/:id（show）
  async getById(id: string): Promise<Task> {
    await delay(300);
    const task = mockTasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return { ...task };
  },

  // POST /api/tasks（store）
  async create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await delay(500);
    const newTask: Task = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    mockTasks = [newTask, ...mockTasks];
    return newTask;
  },

  // PUT /api/tasks/:id（update）
  async update(id: string, data: Partial<Task>): Promise<Task> {
    await delay(500);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    mockTasks[index] = { ...mockTasks[index], ...data };
    return { ...mockTasks[index] };
  },

  // DELETE /api/tasks/:id（destroy）
  async delete(id: string): Promise<void> {
    await delay(300);
    mockTasks = mockTasks.filter(t => t.id !== id);
  },
};
```

---

## 6-4. TanStack Queryの導入

### なぜ TanStack Query？

素のuseEffect + useStateでAPI呼び出しをすると:
```tsx
// NG: よくある初心者パターン
function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetchTasks()
      .then(data => setTasks(data))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  }, []);
  // 問題: キャッシュなし、再取得ロジックなし、ローディング管理が手動、
  //        複数コンポーネントで同じデータを使う場合に重複リクエスト...
}
```

TanStack Queryはこれらを全て自動で管理:
- **キャッシュ**: 同じデータの重複リクエストを防止
- **自動再取得**: ウィンドウフォーカス時、ネットワーク復帰時に自動更新
- **ローディング/エラー状態**: 自動管理
- **楽観的更新**: UIを先に更新して、後でAPIの結果を反映

### インストールとセットアップ

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

```tsx
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5分間はキャッシュを新鮮とみなす
      retry: 1,                     // エラー時に1回リトライ
      refetchOnWindowFocus: true,   // ウィンドウフォーカスで再取得
    },
  },
});
```

```tsx
// src/app/providers.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```tsx
// src/app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
```

---

## 6-5. データ取得（useQuery）

### 基本的な使い方

```tsx
// src/features/tasks/api/task-queries.ts
import { useQuery } from '@tanstack/react-query';
import { mockTaskApi } from '@/mocks/tasks';

// クエリキーの定数化（キャッシュの識別子）
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// タスク一覧取得フック
export function useTaskList() {
  return useQuery({
    queryKey: taskKeys.lists(),    // キャッシュキー
    queryFn: mockTaskApi.getAll,   // データ取得関数
  });
}

// タスク詳細取得フック
export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => mockTaskApi.getById(taskId),
    enabled: !!taskId,  // taskIdがある場合のみ実行
  });
}
```

### コンポーネントでの使用

```tsx
// src/features/tasks/components/TaskListPage.tsx
import { useTaskList } from '../api/task-queries';
import { TaskCard } from './TaskCard';

export function TaskListPage() {
  const { data: tasks, isLoading, isError, error } = useTaskList();

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // エラー表示
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">タスク一覧</h2>
      <div className="space-y-3">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

---

## 6-6. データ変更（useMutation）

### 作成・更新・削除

```tsx
// src/features/tasks/api/task-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockTaskApi } from '@/mocks/tasks';
import { taskKeys } from './task-queries';
import type { Task } from '../types';

// タスク作成
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockTaskApi.create,
    onSuccess: () => {
      // 成功時にタスク一覧のキャッシュを無効化 → 自動再取得
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// タスク更新
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      mockTaskApi.update(id, data),
    onSuccess: (updatedTask) => {
      // キャッシュを直接更新（再リクエスト不要で高速）
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id),
        updatedTask
      );
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// タスク削除
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockTaskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

### コンポーネントでの使用

```tsx
function TaskCreateButton() {
  const createTask = useCreateTask();

  const handleCreate = () => {
    createTask.mutate(
      {
        title: '新しいタスク',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
      },
      {
        onSuccess: () => {
          // 成功時の処理（トースト表示等）
          console.log('タスクを作成しました');
        },
        onError: (error) => {
          console.error('エラー:', error);
        },
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={createTask.isPending}>
      {createTask.isPending ? '作成中...' : 'タスクを作成'}
    </button>
  );
}
```

---

## 6-7. 楽観的更新（Optimistic Updates）

ユーザー体験を向上させるため、APIの応答を待たずにUIを先に更新:

```tsx
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      mockTaskApi.update(id, { status }),

    // 楽観的更新: APIリクエスト前にキャッシュを更新
    onMutate: async ({ id, status }) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // 現在のキャッシュを保存（ロールバック用）
      const previousTasks = queryClient.getQueryData(taskKeys.lists());

      // キャッシュを楽観的に更新
      queryClient.setQueryData(taskKeys.lists(), (old: Task[] | undefined) =>
        old?.map(t => t.id === id ? { ...t, status } : t)
      );

      return { previousTasks };
    },

    // エラー時: キャッシュをロールバック
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },

    // 完了時（成功/失敗問わず）: キャッシュを再検証
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

---

## 6-8. 実際のLaravel APIとの接続（将来の切り替え）

モックAPIから本番APIへの切り替えは、API関数を差し替えるだけ:

```tsx
// src/features/tasks/api/task-api.ts
import { apiClient } from '@/lib/api-client';
import type { Task } from '../types';

// モックAPIと同じインターフェース → 呼び出し側の変更不要
export const taskApi = {
  async getAll(): Promise<Task[]> {
    const { data } = await apiClient.get('/tasks');
    return data.data; // Laravelのリソースコレクション形式
  },

  async getById(id: string): Promise<Task> {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data.data;
  },

  async create(payload: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data } = await apiClient.post('/tasks', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.put(`/tasks/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};
```

> queryFnの参照先を `mockTaskApi` → `taskApi` に変更するだけで切り替え完了。

---

## 章末チェックリスト

- [ ] Axiosでインターセプター付きのAPIクライアントを設定できた
- [ ] モックAPIを作成し、開発を進められる状態にできた
- [ ] useQueryでデータを取得し、ローディング・エラー状態を表示できた
- [ ] useMutationでCRUD操作を実装できた
- [ ] クエリキーの設計方法を理解している
- [ ] 楽観的更新の仕組みを理解している
- [ ] キャッシュの無効化（invalidateQueries）を適切に使えている
- [ ] モックAPIから実API（Laravel）への切り替え方法を理解している
