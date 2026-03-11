# 第3章: コンポーネント設計とライフサイクル

## この章のゴール
- useEffectで副作用（API呼び出し、タイマー等）を扱えるようになる
- useRefでDOM参照や値の保持ができるようになる
- コンポーネントの適切な分割方法を理解する
- children パターンを使いこなす

## 完成イメージ
タスクのフィルタリング・検索機能、タスク詳細モーダルを追加する。

## 作業順序

1. `src/components/ui/Modal.tsx` 作成 — 共通モーダルコンポーネント（依存なし）（3-4）
2. `src/features/tasks/components/TaskSearchBar.tsx` 作成（依存なし）（3-4）
3. `src/features/tasks/components/TaskFilterTabs.tsx` 作成 ※型定義（第2章）に依存（3-4）
4. `src/features/tasks/components/TaskDetailModal.tsx` 作成 ※Modal, 型定義に依存（3-4）
5. `src/hooks/useLocalStorage.ts` 作成 — カスタムフック（依存なし）（3-5）
6. `src/features/tasks/components/TaskListPage.tsx` 更新 — 検索・フィルタ・モーダル・ローカルストレージ保存を統合 ※上記すべてに依存

---

## 3-1. useEffect — 副作用の管理

### 「副作用」とは？

コンポーネントの描画（レンダリング）以外の処理のことです:
- API呼び出し
- タイマーの設定
- ローカルストレージへの保存
- ドキュメントタイトルの変更
- イベントリスナーの登録

Laravel でいうと、ミドルウェアやイベントリスナーのように
「メイン処理の外側で行う処理」に近い概念です。

### 基本構文

```tsx
import { useEffect, useState } from 'react';

function TaskListPage() {
  const [tasks, setTasks] = useState([]);

  // 基本形: useEffect(実行する関数, 依存配列)
  useEffect(() => {
    // ここに副作用の処理を書く
    console.log('コンポーネントがマウントされた');
  }, []); // [] = マウント時に1回だけ実行

  return <div>...</div>;
}
```

### 依存配列のパターン

```tsx
// パターン1: マウント時に1回だけ実行
// → API呼び出し、初期化処理に使う
useEffect(() => {
  fetchTasks();
}, []);

// パターン2: 特定の値が変わるたびに実行
// → 検索フィルタの変更に反応する等
const [searchQuery, setSearchQuery] = useState('');
useEffect(() => {
  console.log('検索クエリが変更された:', searchQuery);
  // 検索処理...
}, [searchQuery]); // searchQueryが変わるたびに実行

// パターン3: 依存配列なし（毎回のレンダリングで実行）
// → ほぼ使わない。パフォーマンスに影響するため注意
useEffect(() => {
  console.log('毎回実行される');
});
```

### クリーンアップ関数

```tsx
// タイマーやイベントリスナーは、コンポーネントが消える時に解除が必要
useEffect(() => {
  const timer = setInterval(() => {
    console.log('1秒ごとに実行');
  }, 1000);

  // クリーンアップ関数: コンポーネントがアンマウントされる時に実行
  return () => {
    clearInterval(timer); // タイマーを解除
  };
}, []);

// ウィンドウイベントの例
useEffect(() => {
  const handleResize = () => {
    console.log('ウィンドウサイズ:', window.innerWidth);
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

> **Laravel との対比:**
> クリーンアップはPHPの `__destruct()` や、Laravelのキューワーカーを
> `graceful shutdown` するのと同じ考え方です。
> リソースを確保したら、不要になった時に解放する。

### よくある間違い

```tsx
// NG: 無限ループになる
useEffect(() => {
  setCount(count + 1); // stateを更新 → 再レンダリング → useEffect再実行 → ...
}, [count]); // countに依存しているので無限ループ

// NG: 依存配列に入れ忘れ（ESLintのexhaustive-depsルールが警告してくれる）
useEffect(() => {
  fetchTasks(userId); // userIdを使っているのに
}, []); // ← 依存配列にuserIdがない → 古いuserIdのまま実行される

// OK:
useEffect(() => {
  fetchTasks(userId);
}, [userId]); // userIdが変わるたびに再実行
```

---

## 3-2. useRef — DOMへの参照と値の保持

### DOMへの参照

jQueryでは `$('#input')` でDOM要素を取得しましたが、
Reactでは `useRef` を使います:

```tsx
import { useRef } from 'react';

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    // .current でDOM要素にアクセス
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="検索..." />
      <button onClick={handleFocus}>フォーカス</button>
    </div>
  );
}
```

### レンダリングをトリガーしない値の保持

```tsx
// useStateとの違い:
// useState → 値が変わると再レンダリングが発生する
// useRef   → 値が変わっても再レンダリングしない

function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    // タイマーIDをrefに保持（再レンダリング不要な値）
    intervalRef.current = window.setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={start}>開始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

### 前回の値を保持する

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 使用例
function TaskCounter({ count }: { count: number }) {
  const prevCount = usePrevious(count);

  return (
    <p>
      現在: {count}
      {prevCount !== undefined && ` (前回: ${prevCount})`}
    </p>
  );
}
```

---

## 3-3. コンポーネント設計の原則

### コンポーネント分割の基準

LaravelのMVC (Model-View-Controller) と似た考え方で、
Reactでも「責務の分離」が重要です:

```
Laravel MVC:
  Model      → データとビジネスロジック
  View       → 表示（Blade）
  Controller → リクエスト処理とルーティング

React:
  Container Component → データ取得とロジック（Controllerに近い）
  Presentational Component → 表示のみ（Viewに近い）
  Custom Hook → ロジックの再利用（Modelに近い）
```

### 分割の実例

```tsx
// NG: 1つのコンポーネントに全部詰め込む
function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // ... 大量のロジック
  // ... 大量のJSX（200行以上）
}

// OK: 責務ごとに分割
// 1. ロジック → カスタムフック
function useTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };
  return { tasks, addTask, updateStatus };
}

// 2. フィルタロジック → カスタムフック
function useTaskFilter(tasks: Task[]) {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return { filter, setFilter, searchQuery, setSearchQuery, filteredTasks };
}

// 3. ページコンポーネント → フックを組み合わせる
function TaskPage() {
  const { tasks, addTask, updateStatus } = useTaskList();
  const { filter, setFilter, searchQuery, setSearchQuery, filteredTasks } = useTaskFilter(tasks);

  return (
    <div>
      <TaskSearchBar value={searchQuery} onChange={setSearchQuery} />
      <TaskFilterTabs current={filter} onChange={setFilter} />
      <TaskList tasks={filteredTasks} onStatusChange={updateStatus} />
      <TaskAddForm onAdd={addTask} />
    </div>
  );
}
```

### children パターン

Laravelの `@yield('content')` / `@section('content')` に相当:

```tsx
// Blade:
// <x-layout>
//     <x-slot name="header">ヘッダー</x-slot>
//     メインコンテンツ
// </x-layout>

// React:
type CardProps = {
  title: string;
  children: React.ReactNode;  // 子要素を受け取る
  footer?: React.ReactNode;   // オプショナルなスロット
};

function Card({ title, children, footer }: CardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}

// 使用側
<Card
  title="タスク概要"
  footer={<Button>保存</Button>}
>
  <p>ここがchildren（メインコンテンツ）</p>
</Card>
```

---

## 3-4. 実践: TaskFlowに検索・フィルタ・モーダルを追加

### 検索バーコンポーネント

```tsx
// src/features/tasks/components/TaskSearchBar.tsx
import { useRef, useEffect } from 'react';

type TaskSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TaskSearchBar({ value, onChange }: TaskSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ページ表示時に自動フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="タスクを検索..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  );
}
```

### フィルタータブコンポーネント

```tsx
// src/features/tasks/components/TaskFilterTabs.tsx
import type { TaskStatus } from '../types';

type FilterOption = TaskStatus | 'all';

type TaskFilterTabsProps = {
  current: FilterOption;
  onChange: (filter: FilterOption) => void;
  counts: Record<FilterOption, number>;
};

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
];

export function TaskFilterTabs({ current, onChange, counts }: TaskFilterTabsProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            current === option.value
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

### モーダルコンポーネント（共通UI）

```tsx
// src/components/ui/Modal.tsx
import { useEffect, useRef } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // スクロール防止
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        // オーバーレイ（背景）クリックで閉じる
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### タスク詳細モーダル

```tsx
// src/features/tasks/components/TaskDetailModal.tsx
import { Modal } from '@/components/ui/Modal';
import type { Task } from '../types';

type TaskDetailModalProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
};

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">説明</label>
          <p className="mt-1 text-gray-900">
            {task.description || '説明なし'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">ステータス</label>
          <p className="mt-1">{task.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">作成日</label>
          <p className="mt-1">{task.createdAt}</p>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 3-5. ローカルストレージとの連携

タスクをブラウザに保存して、リロードしてもデータが残るようにします:

```tsx
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 初期値: ローカルストレージにあればそれを使う
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  // 値が変わるたびにローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// 使用例: useStateをuseLocalStorageに置き換えるだけ
function TaskPage() {
  // これだけで永続化される
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);
}
```

> **PHPセッションとの対比:**
> PHP: `$_SESSION['tasks']` / Laravel: `session('tasks')`
> React: `useLocalStorage('tasks', [])` — ブラウザ側で永続化

---

## 章末チェックリスト

- [ ] useEffectの3パターン（マウント時、依存値変更時、毎回）を理解している
- [ ] クリーンアップ関数の必要性と書き方を理解している
- [ ] useRefでDOM要素にアクセスできる
- [ ] useRefとuseStateの使い分けを理解している
- [ ] コンポーネントを適切な粒度で分割できる
- [ ] childrenパターンを使ってレイアウトコンポーネントを作れる
- [ ] カスタムフックでロジックを再利用できる
- [ ] タスクの検索・フィルタ・モーダル・ローカルストレージ保存が動作する
