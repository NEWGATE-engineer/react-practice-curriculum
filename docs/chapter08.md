# 第8章: カスタムフックとuse系Hook完全攻略

## この章のゴール
- Reactの全use系Hookを理解し、使い分けられるようになる
- カスタムフックの設計パターンを習得する
- TaskFlowのロジックをカスタムフックに整理する

## 完成イメージ
アプリ全体のロジックがカスタムフックに適切に分離された状態。

## 作業順序

1. `src/features/tasks/hooks/useTaskListWithFilter.ts` 作成 — useMemoでフィルタ統合フック（8-2, 8-10）
2. `src/features/tasks/hooks/useTaskActions.ts` 作成 — useCallbackでアクション関数をメモ化（8-3）
3. `src/components/ui/FormField.tsx` 更新 — useIdでアクセシブルなID生成（8-4）
4. `src/features/tasks/components/TaskSearchPage.tsx` 更新 — useDeferredValueで検索遅延対策（8-5）
5. `src/hooks/useMediaQuery.ts` 作成 — レスポンシブ対応カスタムフック（8-10）
6. `src/hooks/useDebounce.ts` 作成 — デバウンスカスタムフック（8-10）
7. 各ページコンポーネントをリファクタリング — ロジックをカスタムフックに抽出

---

## 8-1. use系Hook一覧（React 18 + 19）

### 基本Hook（必須）

| Hook | 用途 | 学習済み |
|------|------|---------|
| `useState` | 状態の管理 | 第2章 |
| `useEffect` | 副作用の管理 | 第3章 |
| `useRef` | DOM参照 / 値の保持 | 第3章 |
| `useContext` | Contextの値を取得 | 第7章 |
| `useReducer` | 複雑な状態管理 | 第7章 |

### パフォーマンス最適化Hook

| Hook | 用途 | この章で学習 |
|------|------|------------|
| `useMemo` | 計算結果のメモ化 | ✅ |
| `useCallback` | 関数のメモ化 | ✅ |

### UI/UX向上Hook

| Hook | 用途 | この章で学習 |
|------|------|------------|
| `useId` | ユニークIDの生成 | ✅ |
| `useTransition` | 非同期UI遷移 | 第9章 |
| `useDeferredValue` | 値の遅延更新 | ✅ |

### その他のHook

| Hook | 用途 | この章で学習 |
|------|------|------------|
| `useImperativeHandle` | refの公開APIをカスタマイズ | ✅ |
| `useLayoutEffect` | DOM更新直後の同期的処理 | ✅ |
| `useDebugValue` | DevToolsでのデバッグ表示 | ✅ |
| `useSyncExternalStore` | 外部ストアの購読 | ✅ |

---

## 8-2. useMemo — 計算結果のメモ化

### いつ使う？

重い計算を毎回のレンダリングで実行するのを避けたい場合:

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useMemo, useState } from 'react';
import type { Task } from '../types';

function TaskStats({ tasks }: { tasks: Task[] }) {
  // NG: レンダリングのたびに計算が実行される
  // const stats = calculateStats(tasks);

  // OK: tasksが変わった時だけ再計算
  const stats = useMemo(() => {
    console.log('統計を計算中...'); // tasksが変わった時だけログが出る
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === 'high').length,
    };
  }, [tasks]); // tasksが変わった時だけ再計算

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="合計" value={stats.total} />
      <StatCard label="未着手" value={stats.todo} />
      <StatCard label="進行中" value={stats.inProgress} />
      <StatCard label="完了" value={stats.done} />
    </div>
  );
}
```

### フィルタリングのメモ化

```tsx
// ※ 概念説明用コード（ファイルには書きません）
function TaskListPage() {
  const { data: tasks = [] } = useTaskList();
  const filter = useTaskFilterStore(state => state.filter);
  const searchQuery = useTaskFilterStore(state => state.searchQuery);

  // フィルタ結果をメモ化
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => filter === 'all' || t.status === filter)
      .filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [tasks, filter, searchQuery]);

  return <TaskList tasks={filteredTasks} />;
}
```

> **注意: useMemoの過剰使用を避ける**
> 単純な計算（配列の.length等）にuseMemoは不要。
> 「配列のフィルタ・ソート」「オブジェクトの変換」など
> ある程度重い処理にだけ使いましょう。

---

## 8-3. useCallback — 関数のメモ化

### なぜ必要？

```tsx
// ※ 概念説明用コード（ファイルには書きません）
function ParentComponent() {
  const [count, setCount] = useState(0);

  // 毎回新しい関数が作られる → 子コンポーネントが毎回再レンダリング
  const handleClick = () => {
    console.log('clicked');
  };

  // useCallbackで同じ関数参照を保持
  const handleClickMemo = useCallback(() => {
    console.log('clicked');
  }, []); // 依存配列が空 → 常に同じ関数

  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      {/* React.memoと組み合わせて効果を発揮 */}
      <ExpensiveChild onClick={handleClickMemo} />
    </>
  );
}

// React.memoでPropsが変わらなければ再レンダリングをスキップ
const ExpensiveChild = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('ExpensiveChild rendered');
  return <button onClick={onClick}>Click</button>;
});
```

### 実践: useTaskActions カスタムフック

```tsx
// src/features/tasks/hooks/useTaskActions.ts
import { useCallback } from 'react';
import { useUpdateTask, useDeleteTask } from '../api/task-mutations';
import { useToastStore } from '@/stores/toast-store';
import type { TaskStatus } from '../types';

export function useTaskActions() {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addToast = useToastStore(state => state.addToast);

  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    updateTask.mutate(
      { id, data: { status } },
      { onSuccess: () => addToast('ステータスを更新しました', 'success') }
    );
  }, [updateTask, addToast]);

  const handleDelete = useCallback((id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => addToast('タスクを削除しました', 'success'),
    });
  }, [deleteTask, addToast]);

  return { handleStatusChange, handleDelete };
}
```

---

## 8-4. useId — ユニークIDの生成

フォームのlabel-input紐づけ等で使用:

```tsx
import { useId } from 'react';
```

### FormFieldの更新（useId追加）

第5章で作成したFormFieldにuseIdを追加して、labelとchildren内の入力要素を正しく紐づけます:

```tsx
// src/components/ui/FormField.tsx（更新）
import { useId } from 'react';
import type { FieldError } from 'react-hook-form';

type FormFieldProps = {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId(); // 例: ':r1:', ':r2:' ... SSRでもクライアントと一致

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {/* childrenにidを渡すためにラップ */}
      <div id={`${id}-field`}>
        {children}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}
```

### useIdの基本的な使い方

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// 複数フィールドがあっても一意なIDが自動生成される
function MyForm() {
  return (
    <form>
      <FormField label="名前">
        <input type="text" />    {/* 親のid=":r1:" */}
      </FormField>
      <FormField label="メール">
        <input type="email" /> {/* 親のid=":r2:" */}
      </FormField>
    </form>
  );
}
```

> **Math.random()やDate.now()との違い:**
> useIdはサーバーサイドレンダリング(SSR)でもクライアントと同じIDを生成。
> ハイドレーション時の不一致を防ぎます。

---

## 8-5. useDeferredValue — 値の遅延更新

重い処理の入力遅延を防ぐ:

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useDeferredValue, useMemo, useState } from 'react';

function TaskSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: tasks = [] } = useTaskList();

  // 入力値の遅延バージョンを取得
  // → 入力フィールドは即座に更新、検索結果は遅延して更新
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredQuery;

  const filteredTasks = useMemo(() => {
    return tasks.filter(t =>
      t.title.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [tasks, deferredQuery]);

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="検索..."
      />
      {/* 検索中は半透明にして処理中を示す */}
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

---

## 8-6. useImperativeHandle — refのカスタマイズ

親コンポーネントに公開するAPIを制限する:

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { forwardRef, useImperativeHandle, useRef } from 'react';

// 公開するAPIの型
type CustomInputHandle = {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
};

const CustomInput = forwardRef<CustomInputHandle, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // 親に公開するAPIをカスタマイズ
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        if (inputRef.current) inputRef.current.value = '';
      },
      getValue: () => inputRef.current?.value || '',
    }));

    return <input ref={inputRef} placeholder={placeholder} className="border p-2 rounded" />;
  }
);

// 親コンポーネント
function ParentComponent() {
  const inputRef = useRef<CustomInputHandle>(null);

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="入力..." />
      <button onClick={() => inputRef.current?.focus()}>フォーカス</button>
      <button onClick={() => inputRef.current?.clear()}>クリア</button>
      <button onClick={() => alert(inputRef.current?.getValue())}>値取得</button>
    </div>
  );
}
```

---

## 8-7. useLayoutEffect — DOM更新直後の同期処理

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useLayoutEffect, useRef, useState } from 'react';

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // useLayoutEffect: DOMが更新された直後、画面描画の前に実行
  // → ちらつきを防ぐ（useEffectだと一瞬間違った位置に表示される）
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.top - 30, left: rect.left });
    }
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      {children}
      <div style={{ position: 'fixed', top: position.top, left: position.left }}
        className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
        {text}
      </div>
    </div>
  );
}
```

> **useEffect vs useLayoutEffect:**
> - useEffect: 画面描画後に非同期で実行（ほとんどの場合はこちら）
> - useLayoutEffect: 画面描画前に同期で実行（レイアウト計算が必要な場合のみ）

---

## 8-8. useDebugValue — DevToolsでのデバッグ表示

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useDebugValue } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // React DevToolsに「Online」または「Offline」と表示される
  useDebugValue(isOnline ? 'Online' : 'Offline');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 8-9. useSyncExternalStore — 外部ストアの購読

React外部の値をReactのレンダリングサイクルに同期:

```tsx
// ※ 概念説明用コード（ファイルには書きません）
import { useSyncExternalStore } from 'react';

// ウィンドウサイズの購読
function useWindowSize() {
  const size = useSyncExternalStore(
    // subscribe: 変更をリッスン
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    // getSnapshot: 現在の値を返す
    () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  );

  return size;
}

// 使用
function ResponsiveLayout() {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

> **Zustandの内部:**
> 実は Zustand も内部で `useSyncExternalStore` を使っています。
> 普段は Zustand を使えばOKですが、原理を知っておくと理解が深まります。

---

## 8-10. カスタムフック設計パターン

### パターン1: データ取得 + 状態管理の統合

```tsx
// src/features/tasks/hooks/useTaskListWithFilter.ts
import { useMemo } from 'react';
import { useTaskList } from '../api/task-queries';
import { useTaskFilterStore } from '../stores/task-filter-store';

export function useTaskListWithFilter() {
  const { data: tasks = [], isLoading, isError } = useTaskList();
  const filter = useTaskFilterStore(state => state.filter);
  const searchQuery = useTaskFilterStore(state => state.searchQuery);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => filter === 'all' || t.status === filter)
      .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, filter, searchQuery]);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks]);

  return { filteredTasks, counts, isLoading, isError };
}
```

### パターン2: ブラウザAPIのラッパー

```tsx
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 使用
function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  if (isMobile) return null;
  return <aside>...</aside>;
}
```

### パターン3: デバウンス

```tsx
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用: 検索入力を300msデバウンス
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // API検索を実行
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## 8-11. Hookのルール（重要）

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// ルール1: トップレベルでのみ呼び出す
// NG:
if (isLoggedIn) {
  const [name, setName] = useState(''); // 条件分岐内はNG
}

// NG:
for (const item of items) {
  useEffect(() => {}, []); // ループ内はNG
}

// ルール2: React関数コンポーネント or カスタムフック内でのみ使用
// NG:
function normalFunction() {
  const [state, setState] = useState(''); // 通常の関数内はNG
}

// OK:
function useCustomHook() {
  const [state, setState] = useState(''); // カスタムフック内はOK
  return state;
}
```

---

## 章末チェックリスト

- [ ] useMemo で計算結果をメモ化できる
- [ ] useCallback で関数をメモ化できる（React.memoとの組み合わせ）
- [ ] useId でアクセシブルなフォームを作れる
- [ ] useDeferredValue で入力遅延を防げる
- [ ] useImperativeHandle でrefのAPIをカスタマイズできる
- [ ] useLayoutEffect と useEffect の違いを理解している
- [ ] useSyncExternalStore の仕組みを理解している
- [ ] カスタムフックを設計し、ロジックを再利用できる
- [ ] Hookのルール（トップレベル、React関数内のみ）を守れている
