# 第9章: パフォーマンス最適化

## この章のゴール
- React.memoで不要な再レンダリングを防ぐ
- コード分割（Code Splitting）で初期読み込みを高速化する
- Suspenseでローディング体験を改善する
- useTransitionで応答性の高いUIを実現する
- React DevToolsでパフォーマンスを計測する

## 完成イメージ
TaskFlowアプリが高速に動作し、大量のタスクでもスムーズに操作できる状態。

## 作業順序

1. `src/features/tasks/components/TaskCard.tsx` 更新 — React.memoでメモ化（9-2）
2. `src/features/tasks/components/TaskListPage.tsx` 更新 — useCallbackとReact.memoの組み合わせ（9-2）
3. `src/features/tasks/components/TaskListSkeleton.tsx` 作成 — スケルトンUI（依存なし）（9-4）
4. `src/components/feedback/PageLoading.tsx` 作成 — 共通ローディングUI（依存なし）（9-3）
5. `src/app/router.tsx` 更新 — lazy + Suspenseでコード分割 ※PageLoadingに依存（9-3）
6. `@tanstack/react-virtual` をインストール（9-6）
7. `src/features/tasks/components/VirtualTaskList.tsx` 作成 — 仮想スクロール対応（9-6）
8. React DevToolsのProfilerでパフォーマンス計測・確認（9-7）

---

## 9-1. 再レンダリングの仕組みを理解する

### Reactの再レンダリングが発生するタイミング

```
1. stateが更新された時
2. 親コンポーネントが再レンダリングされた時
3. Contextの値が変わった時
```

> **重要な誤解:**
> 「再レンダリング = 遅い」ではありません。
> Reactの仮想DOMは非常に高速で、ほとんどの場合は問題になりません。
> **最適化は「問題が起きてから」行いましょう。**

### 再レンダリングの確認方法

React DevToolsの「Highlight updates when components render」を有効にすると、
再レンダリングされたコンポーネントが視覚的にハイライトされます。

---

## 9-2. React.memo — コンポーネントのメモ化

### Propsが変わらなければ再レンダリングをスキップ

```tsx
import { memo } from 'react';
import type { Task } from '../types';

// React.memoでラップ → Propsが同じなら再レンダリングしない
export const TaskCard = memo(function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  console.log(`TaskCard rendered: ${task.id}`); // 確認用

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3>{task.title}</h3>
      <button onClick={() => onStatusChange(task.id, 'done')}>完了</button>
      <button onClick={() => onDelete(task.id)}>削除</button>
    </div>
  );
});
```

### React.memoが効果的な場面

```tsx
function TaskListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: tasks = [] } = useTaskList();

  // useCallbackで関数の参照を安定化（React.memoと組み合わせ）
  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    // ...
  }, []);

  const handleDelete = useCallback((id: string) => {
    // ...
  }, []);

  return (
    <div>
      {/* 検索入力が変わるたびに親は再レンダリング */}
      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

      {/* React.memo + useCallback により、関係ないタスクカードは再レンダリングされない */}
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

---

## 9-3. コード分割（Code Splitting）

### lazy + Suspense

```tsx
// src/app/router.tsx
import { lazy, Suspense } from 'react';

// lazy: コンポーネントを動的にインポート（必要な時にだけ読み込み）
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'));
const TaskListPage = lazy(() => import('@/features/tasks/components/TaskListPage'));
const TaskDetailPage = lazy(() => import('@/features/tasks/components/TaskDetailPage'));
const ProjectListPage = lazy(() => import('@/features/projects/components/ProjectListPage'));

// ローディングUI
function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<PageLoading />}>
            <TaskListPage />
          </Suspense>
        ),
      },
      // ...
    ],
  },
]);
```

> **Laravelとの対比:**
> LaravelのBladeでは全ページのHTMLが毎回サーバーから返されますが、
> SPAではJavaScriptバンドルが1つの巨大ファイルになりがちです。
> Code Splittingにより、ページごとにJSを分割して必要な時だけ読み込みます。

### 効果の確認

```bash
# ビルド時にチャンク分割を確認
npm run build
# dist/assets/ に複数のJSファイルが生成される
```

---

## 9-4. Suspense — ローディング体験の統一

### データ取得との組み合わせ

TanStack Queryの `useSuspenseQuery` を使うと、SuspenseベースのUI設計が可能:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';

// このフックはデータが準備されるまでSuspenseを発動させる
function useTaskListSuspense() {
  return useSuspenseQuery({
    queryKey: taskKeys.lists(),
    queryFn: mockTaskApi.getAll,
  });
}

// コンポーネント側ではローディング判定が不要！
function TaskList() {
  const { data: tasks } = useTaskListSuspense();
  // data は必ず存在する（Suspenseが待ってくれるので）

  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}

// 親でSuspenseを配置
function TaskPage() {
  return (
    <div>
      <h1>タスク一覧</h1>
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList />
      </Suspense>
    </div>
  );
}
```

### スケルトンUI

```tsx
// src/features/tasks/components/TaskListSkeleton.tsx
export function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

---

## 9-5. useTransition — 緊急度の低い更新を分離

```tsx
import { useTransition, useState } from 'react';

function TaskFilterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const { data: tasks = [] } = useTaskList();

  const handleSearch = (value: string) => {
    // 入力フィールドの更新は即座に反映（緊急）
    setSearchQuery(value);

    // フィルタリング結果の更新は遅延OK（非緊急）
    startTransition(() => {
      // 重い処理をここに入れる
      // Reactは他の緊急な更新を優先してくれる
    });
  };

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {/* isPendingでトランジション中を表示 */}
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <TaskList tasks={filteredTasks} />
      </div>
    </div>
  );
}
```

> **useDeferredValue（第8章）との違い:**
> - `useDeferredValue`: 値を遅延させる（受け身的）
> - `useTransition`: 更新のタイミングを制御する（能動的）
> どちらも「緊急でない更新を遅延させる」という点は同じです。

---

## 9-6. 仮想化（Virtualization）

大量のリスト（1000件以上）を効率的にレンダリング:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 各行の推定高さ(px)
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TaskCard task={task} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

> **なぜ仮想化が必要？**
> 1000件のタスクがあると、1000個のDOM要素が生成されます。
> 仮想化により、画面に見えている分（例: 10件）だけDOMを生成。
> スクロールに応じて動的に入れ替えます。

---

## 9-7. パフォーマンス計測

### React DevToolsのProfiler

1. React DevToolsの「Profiler」タブを開く
2. 「Record」ボタンを押して操作する
3. 停止して結果を確認:
   - どのコンポーネントが再レンダリングされたか
   - 各レンダリングにかかった時間
   - 再レンダリングの原因

### 最適化の判断基準

```
最適化すべき場合:
  - ユーザーの操作に対する応答が遅い（200ms以上）
  - スクロールがカクつく
  - 入力が遅延する

最適化不要な場合:
  - DevToolsで再レンダリングが見えるが、体感で遅くない
  - リストが数十件程度
  - 計算が単純
```

**「計測せずに最適化するな（Don't optimize prematurely）」**

---

## 章末チェックリスト

- [ ] React.memoで不要な再レンダリングを防げる
- [ ] useCallback + React.memoの組み合わせを理解している
- [ ] lazy + Suspenseでコード分割を実装できた
- [ ] スケルトンUIでローディング体験を改善できた
- [ ] useTransitionで非緊急な更新を分離できる
- [ ] 仮想化の概念を理解している
- [ ] React DevToolsのProfilerでパフォーマンスを計測できる
- [ ] 「早すぎる最適化」を避け、計測に基づいた判断ができる
