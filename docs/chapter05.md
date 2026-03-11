# 第5章: フォームとバリデーション

## この章のゴール
- React Hook Formで効率的なフォーム管理を習得する
- Zodでスキーマベースのバリデーションを実装する
- 再利用可能なフォームコンポーネントを設計する
- TaskFlowにタスク作成・編集フォームを実装する

## 完成イメージ
タスク作成・編集フォームがバリデーション付きで動作する。

## 作業順序

1. `react-hook-form`, `zod`, `@hookform/resolvers` をインストール（5-1）
2. `src/features/tasks/types/schema.ts` 作成 — Zodスキーマと型定義（依存なし）（5-3）
3. `src/components/ui/FormField.tsx` 作成 — 汎用フォームフィールド（依存なし）（5-4）
4. `src/components/ui/Input.tsx` 作成 — 汎用Inputコンポーネント（依存なし）（5-4）
5. `src/features/tasks/components/TaskCreateForm.tsx` 作成 ※schema, FormField, Inputに依存（5-2, 5-3）
6. `src/features/tasks/components/TaskEditForm.tsx` 作成 ※schema, FormField, Inputに依存（5-5）
7. 既存ページコンポーネントにフォームを統合

---

## 5-1. なぜReact Hook Form？

### 素のReactでのフォーム管理の課題

```tsx
// 素のReact: 入力フィールドごとにstateが必要
function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フィールドが増えるたびにstateが増える...
  // バリデーションロジックも手動で書く必要がある...
  // 毎回の入力でコンポーネント全体が再レンダリング...

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = 'タイトルは必須です';
    if (title.length > 100) newErrors.title = '100文字以内で入力してください';
    // ... 面倒
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
}
```

### React Hook Form: シンプルかつ高性能

```tsx
// React Hook Form: registerで紐づけるだけ
import { useForm } from 'react-hook-form';

function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data); // { title: '...', description: '...', ... }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title', { required: 'タイトルは必須です' })} />
      {errors.title && <p>{errors.title.message}</p>}
      <button type="submit">送信</button>
    </form>
  );
}
```

> **Laravelとの対比:**
> React Hook Form + Zod は、Laravelの `FormRequest` + バリデーションルールに相当。
> ```php
> // Laravel: FormRequest
> public function rules() {
>     return [
>         'title' => 'required|max:100',
>         'description' => 'nullable|max:500',
>     ];
> }
> ```

### インストール

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 5-2. React Hook Form の基本

### 基本的な使い方（TypeScript版）

```tsx
import { useForm } from 'react-hook-form';

// フォームのデータ型を定義
type TaskFormData = {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
};

function TaskCreateForm() {
  const {
    register,     // input要素をフォームに登録する関数
    handleSubmit,  // フォーム送信時のラッパー（バリデーション後に実行）
    formState: {
      errors,       // バリデーションエラー
      isSubmitting, // 送信中フラグ
      isDirty,      // 変更があるかどうか
    },
    reset,         // フォームをリセット
    watch,         // 値の変更を監視
    setValue,      // プログラムから値を設定
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    console.log('送信データ:', data);
    // API呼び出し等
    reset(); // 送信後にフォームリセット
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* タイトル */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タイトル
        </label>
        <input
          {...register('title', {
            required: 'タイトルは必須です',
            maxLength: { value: 100, message: '100文字以内で入力してください' },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* 説明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          {...register('description', {
            maxLength: { value: 500, message: '500文字以内で入力してください' },
          })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* 優先度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          優先度
        </label>
        <select
          {...register('priority')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </div>

      {/* 期限 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          期限
        </label>
        <input
          type="date"
          {...register('dueDate')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? '送信中...' : 'タスクを作成'}
      </button>
    </form>
  );
}
```

---

## 5-3. Zodによるスキーマバリデーション

### なぜZod？

React Hook Formの `register` に直接ルールを書くこともできますが、
**Zodスキーマ**を使うと:
- バリデーションルールを1箇所にまとめられる
- TypeScriptの型を自動生成できる（型とバリデーションの二重管理が不要）
- 再利用・テストが容易

### 基本構文

```tsx
import { z } from 'zod';

// スキーマ定義（Laravelの rules() に相当）
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')           // required
    .max(100, '100文字以内で入力してください'), // max:100
  description: z
    .string()
    .max(500, '500文字以内で入力してください')
    .optional()                              // nullable
    .default(''),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      '有効な日付を入力してください'
    ),
});

// スキーマから型を自動生成！（手動で型定義する必要がない）
type TaskFormData = z.infer<typeof taskFormSchema>;
// → { title: string; description: string; priority: 'low' | 'medium' | 'high'; dueDate?: string; }
```

### Laravelバリデーションとの対比

```php
// Laravel
public function rules() {
    return [
        'title'       => 'required|string|max:100',
        'description' => 'nullable|string|max:500',
        'priority'    => 'required|in:low,medium,high',
        'due_date'    => 'nullable|date',
    ];
}

public function messages() {
    return [
        'title.required' => 'タイトルは必須です',
        'title.max'      => '100文字以内で入力してください',
    ];
}
```

```tsx
// Zod（上記のLaravelルールとほぼ1対1で対応）
const taskFormSchema = z.object({
  title:       z.string().min(1, 'タイトルは必須です').max(100, '100文字以内'),
  description: z.string().max(500).optional().default(''),
  priority:    z.enum(['low', 'medium', 'high']),
  dueDate:     z.string().optional(),
});
```

### React Hook Form と Zod の連携

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, '100文字以内'),
  description: z.string().max(500, '500文字以内').default(''),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

function TaskCreateForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema), // ← Zodスキーマを接続
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    // dataはZodでバリデーション済み＆型安全
    console.log(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* register するだけ。バリデーションルールはZodスキーマ側に集約 */}
      <input {...register('title')} />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}
      {/* ... */}
    </form>
  );
}
```

---

## 5-4. 再利用可能なフォームコンポーネント

### 汎用Inputコンポーネント

```tsx
// src/components/ui/FormField.tsx
import type { FieldError } from 'react-hook-form';

type FormFieldProps = {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}
```

```tsx
// src/components/ui/Input.tsx
import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

> **forwardRef とは？**
> React Hook Form の `register` は内部的に `ref` を使います。
> カスタムコンポーネントに `ref` を渡すには `forwardRef` が必要です。
> （第8章で詳しく解説します）

### 使用例（リファクタリング後）

```tsx
function TaskCreateForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} />
      </FormField>

      <FormField label="説明" error={errors.description}>
        <textarea {...register('description')} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </FormField>

      <FormField label="優先度" error={errors.priority}>
        <select {...register('priority')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </FormField>

      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg">
        タスクを作成
      </button>
    </form>
  );
}
```

---

## 5-5. 編集フォーム（既存データの読み込み）

```tsx
// src/features/tasks/components/TaskEditForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from '../types/schema';
import type { Task } from '../types';

type TaskEditFormProps = {
  task: Task;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
};

export function TaskEditForm({ task, onSubmit, onCancel }: TaskEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
    },
  });

  // taskが変わったらフォームをリセット
  useEffect(() => {
    reset({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
  }, [task, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* フォームフィールド（TaskCreateFormと同じ構成） */}
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} />
      </FormField>
      {/* ... */}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
```

---

## 5-6. 高度なZodパターン

### 条件付きバリデーション

```tsx
// 例: ステータスが「完了」の場合は完了日が必須
const taskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
  completedAt: z.string().optional(),
}).refine(
  (data) => data.status !== 'done' || data.completedAt,
  {
    message: '完了日を入力してください',
    path: ['completedAt'], // エラーを表示するフィールド
  }
);
```

### ネストされたオブジェクト

```tsx
const projectFormSchema = z.object({
  name: z.string().min(1, 'プロジェクト名は必須です'),
  members: z.array(
    z.object({
      userId: z.string(),
      role: z.enum(['owner', 'editor', 'viewer']),
    })
  ).min(1, 'メンバーを1人以上追加してください'),
});
```

---

## 章末チェックリスト

- [ ] React Hook Formの基本（register, handleSubmit, errors）を使いこなせる
- [ ] Zodでバリデーションスキーマを定義できる
- [ ] zodResolverでRHFとZodを連携できる
- [ ] z.inferでスキーマから型を自動生成できる
- [ ] 再利用可能なFormField/Inputコンポーネントを作成できた
- [ ] 作成フォームと編集フォームの両方が動作する
- [ ] isDirty, isSubmittingなどのフォーム状態を活用できる
- [ ] Laravelのバリデーションとの類似性を理解している
