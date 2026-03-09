# 第2章: イベントとState管理

## この章のゴール
- useStateを使った状態管理を習得する
- イベントハンドリングの基本を理解する
- 条件分岐レンダリングとリスト描画をマスターする
- TaskFlowにタスク一覧の表示・追加機能を実装する

## 完成イメージ
タスク一覧画面で、タスクの表示・追加・ステータス切り替えができる状態。

---

## 2-1. useState — Reactの状態管理の基本

### jQueryとの根本的な違い

```js
// jQuery: 自分でDOMを見つけて書き換える
$('#counter').text(Number($('#counter').text()) + 1);

// React: 状態を更新すると、UIが自動的に再描画される
const [count, setCount] = useState(0);
// setCount(count + 1) → Reactが自動で画面を更新
```

### 基本構文

```tsx
import { useState } from 'react';

function Counter() {
  // const [現在の値, 更新関数] = useState(初期値);
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>リセット</button>
    </div>
  );
}
```

### TypeScriptでの型指定

```tsx
// 型推論が効く場合（初期値から推論される）
const [count, setCount] = useState(0);           // number
const [name, setName] = useState('');             // string
const [isOpen, setIsOpen] = useState(false);      // boolean

// 明示的に型を指定する場合（初期値がnullの可能性があるとき等）
const [user, setUser] = useState<User | null>(null);

// 配列の場合
const [items, setItems] = useState<string[]>([]);

// オブジェクトの場合
type Task = {
  id: number;
  title: string;
  completed: boolean;
};
const [tasks, setTasks] = useState<Task[]>([]);
```

### PHPとの比較

```php
// PHP (Laravel): セッションやDBで状態を保持
session(['count' => session('count', 0) + 1]);
// ページリロードが必要

// React: メモリ上で状態を保持し、リアルタイム更新
const [count, setCount] = useState(0);
setCount(prev => prev + 1);
// リロード不要、即座に画面に反映
```

### Stateの重要ルール

```tsx
// NG: 直接変更してはいけない（Reactが変更を検知できない）
const [tasks, setTasks] = useState<Task[]>([]);
tasks.push(newTask);  // ← これはNG！

// OK: 新しい配列/オブジェクトを作って更新
setTasks([...tasks, newTask]);        // スプレッド構文で新しい配列
setTasks(prev => [...prev, newTask]); // 関数形式（推奨）
```

> **なぜ関数形式 `prev =>` が推奨？**
> 連続して更新する場合、直接 `count + 1` だと古い値を参照する可能性がある。
> `prev => prev + 1` なら常に最新の値を基に更新できる。

---

## 2-2. イベントハンドリング

### 基本的なイベント

```tsx
function EventExamples() {
  // クリックイベント
  const handleClick = () => {
    console.log('クリックされた');
  };

  // 引数を渡す場合
  const handleDelete = (id: number) => {
    console.log(`ID: ${id} を削除`);
  };

  // イベントオブジェクトを受け取る場合
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  // フォーム送信（ページ遷移を防ぐ）
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();  // PHPでいう return false; と同じ効果
    console.log('送信処理');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>クリック</button>
      <button onClick={() => handleDelete(1)}>削除</button>
    </form>
  );
}
```

### jQuery との対比

```js
// jQuery
$('#btn').on('click', function(e) {
  e.preventDefault();
  // 処理
});

// React — JSXに直接書く
<button onClick={handleClick}>クリック</button>
// ※ onClick（キャメルケース）であることに注意
```

### よく使うイベント型

| イベント | 型 | 用途 |
|---------|------|------|
| onClick | `React.MouseEvent` | クリック |
| onChange | `React.ChangeEvent<HTMLInputElement>` | 入力変更 |
| onSubmit | `React.FormEvent<HTMLFormElement>` | フォーム送信 |
| onKeyDown | `React.KeyboardEvent` | キー入力 |
| onFocus / onBlur | `React.FocusEvent` | フォーカス |

---

## 2-3. 条件分岐レンダリング

Bladeの `@if` に相当するReactのパターン:

```tsx
type TaskStatusProps = {
  status: 'todo' | 'in_progress' | 'done';
};

function TaskStatus({ status }: TaskStatusProps) {
  // パターン1: && 演算子（条件がtrueのときだけ表示）
  // Bladeの @if($condition) ... @endif に相当
  return (
    <div>
      {status === 'done' && (
        <span className="text-green-600">完了</span>
      )}
    </div>
  );

  // パターン2: 三項演算子（if-else）
  return (
    <div>
      {status === 'done'
        ? <span className="text-green-600">完了</span>
        : <span className="text-yellow-600">未完了</span>
      }
    </div>
  );

  // パターン3: 早期return（複雑な条件分岐）
  if (status === 'done') {
    return <span className="text-green-600">完了</span>;
  }
  if (status === 'in_progress') {
    return <span className="text-blue-600">進行中</span>;
  }
  return <span className="text-gray-600">未着手</span>;
}
```

---

## 2-4. リスト描画

LaravelのBladeでの `@foreach` に相当:

```tsx
type Task = {
  id: number;
  title: string;
  completed: boolean;
};

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'プロジェクト設計', completed: false },
    { id: 2, title: 'API実装', completed: true },
    { id: 3, title: 'テスト作成', completed: false },
  ]);

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        // key は各要素を一意に識別するために必須
        // Laravelの @foreach($items as $item) でいう $item->id に相当
        <li
          key={task.id}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => {
              setTasks(prev =>
                prev.map(t =>
                  t.id === task.id ? { ...t, completed: !t.completed } : t
                )
              );
            }}
          />
          <span className={task.completed ? 'line-through text-gray-400' : ''}>
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

> **keyが必要な理由:**
> Reactはkeyを使って、どの要素が変更・追加・削除されたかを効率的に判定します。
> keyがないと、リスト全体を再描画するため、パフォーマンスが低下します。
> **配列のindexをkeyに使うのは避けてください**（要素の追加・削除で順番が変わるため）。

---

## 2-5. 実践: TaskFlowにタスク一覧機能を実装

### 型定義

```tsx
// src/features/tasks/types/index.ts
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
};
```

### タスクカードコンポーネント

```tsx
// src/features/tasks/components/TaskCard.tsx
import type { Task, TaskStatus } from '../types';

type TaskCardProps = {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
};

const statusConfig = {
  todo: { label: '未着手', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-700' },
  done: { label: '完了', color: 'bg-green-100 text-green-700' },
} as const;

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const config = statusConfig[task.status];

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        </div>
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}
        >
          {config.label}
        </button>
      </div>
    </div>
  );
}
```

### タスク追加フォーム（簡易版）

```tsx
// src/features/tasks/components/TaskAddForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type TaskAddFormProps = {
  onAdd: (title: string, description: string) => void;
};

export function TaskAddForm({ onAdd }: TaskAddFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title.trim(), description.trim());
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスク名を入力..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明（任意）"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button>タスクを追加</Button>
    </form>
  );
}
```

### タスク一覧ページ

```tsx
// src/features/tasks/components/TaskListPage.tsx
import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { TaskAddForm } from './TaskAddForm';
import type { Task, TaskStatus } from '../types';

// 仮データ
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'プロジェクト計画書を作成',
    description: 'スコープと期限を決める',
    status: 'todo',
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    title: 'デザインカンプを確認',
    description: 'Figmaで共有されたデザインをレビュー',
    status: 'in_progress',
    createdAt: '2025-01-02',
  },
  {
    id: '3',
    title: '開発環境構築',
    description: 'Docker + Viteの環境を整備',
    status: 'done',
    createdAt: '2025-01-03',
  },
];

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleAdd = (title: string, description: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">タスク一覧</h2>

      <div className="mb-6">
        <TaskAddForm onAdd={handleAdd} />
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            タスクがありません。最初のタスクを追加しましょう！
          </p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 2-6. State設計のコツ

### 単一責任の原則

```tsx
// NG: 1つのstateに詰め込みすぎ
const [formData, setFormData] = useState({
  title: '',
  description: '',
  isSubmitting: false,
  error: null,
});

// OK: 関心事ごとに分離
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 派生データはstateにしない

```tsx
// NG: フィルタ結果をstateで持つ（データの二重管理）
const [tasks, setTasks] = useState<Task[]>([]);
const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

// OK: 元データから都度計算する
const [tasks, setTasks] = useState<Task[]>([]);
const completedTasks = tasks.filter(t => t.status === 'done');
const todoTasks = tasks.filter(t => t.status === 'todo');
```

---

## 章末チェックリスト

- [ ] useStateで文字列・数値・真偽値・配列・オブジェクトを管理できる
- [ ] イベントハンドラを正しく設定できる（onClick, onChange, onSubmit）
- [ ] 条件分岐レンダリング（&&, 三項演算子）を使い分けられる
- [ ] map()でリスト描画ができ、keyの重要性を理解している
- [ ] 配列のstateをイミュータブルに更新できる（スプレッド構文, map, filter）
- [ ] TaskFlowでタスクの表示・追加・ステータス変更が動作する
