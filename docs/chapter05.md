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
2. `src/features/tasks/types/schema.ts` 作成 — Zodスキーマと型定義（5-3）
3. `src/components/ui/FormField.tsx` 作成 — 汎用フォームフィールド（5-4）
4. `src/components/ui/Input.tsx` 作成 — 汎用Inputコンポーネント（5-4）
5. `src/features/tasks/components/TaskCreateForm.tsx` 作成 ※schema, FormField, Inputに依存（5-4）
6. `src/features/tasks/components/TaskEditForm.tsx` 作成 ※schema, FormField, Inputに依存（5-5）
7. 既存ページコンポーネントにフォームを統合

---

## 5-1. なぜReact Hook Form？

### 素のReactでのフォーム管理の課題

```tsx
// ※ 概念説明用コード（ファイルには書きません）

// 素のReact: 入力フィールドごとにstateが必要
function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
// ※ 概念説明用コード（ファイルには書きません）

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

### 主要APIの説明

React Hook Formの `useForm` が返す主要なAPIを理解しましょう:

```tsx
// ※ 概念説明用コード（ファイルには書きません）

import { useForm } from 'react-hook-form';

type FormData = {
  title: string;
  description: string;
};

function ExampleForm() {
  const {
    register,      // input要素をフォームに登録する関数
    handleSubmit,  // フォーム送信時のラッパー（バリデーション後に実行）
    formState: {
      errors,       // バリデーションエラー
      isSubmitting, // 送信中フラグ
      isDirty,      // 変更があるかどうか
    },
    reset,         // フォームをリセット
    watch,         // 値の変更を監視
    setValue,      // プログラムから値を設定
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {/* registerでinput要素をフォームに登録 */}
      <input {...register('title', { required: 'タイトルは必須です' })} />
      {errors.title && <p>{errors.title.message}</p>}

      <textarea {...register('description')} />

      <button type="submit" disabled={isSubmitting}>送信</button>
    </form>
  );
}
```

### ポイント

- `register('fieldName')` でinput要素をフォームに登録（`name`, `ref`, `onChange`, `onBlur` を自動付与）
- `handleSubmit` はバリデーションを通過した場合のみコールバックを実行
- `errors` オブジェクトにフィールドごとのエラーメッセージが格納される
- `register` の第2引数にバリデーションルールを直接書くこともできるが、次のセクションで紹介するZodスキーマに集約するのがベストプラクティス

---

## 5-3. Zodスキーマファイルの作成

バリデーションルールを `register` に直接書く代わりに、**Zodスキーマ**として独立ファイルに定義します。

### なぜZod？

- バリデーションルールを1箇所にまとめられる
- TypeScriptの型を自動生成できる（型とバリデーションの二重管理が不要）
- 再利用・テストが容易

### スキーマファイルの作成

> **注意:** この章の時点では Task型に `priority`/`dueDate` はまだありません（第6章で追加）。
> フォームで扱うフィールドは `title` と `description` のみです。

```tsx
// src/features/tasks/types/schema.ts
import { z } from 'zod';

// Zodスキーマ定義（Laravelの FormRequest::rules() に相当）
export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, '100文字以内で入力してください'),
  description: z
    .string()
    .max(500, '500文字以内で入力してください')
    .default(''),
});

// スキーマから型を自動生成（手動で型定義する必要がない）
export type TaskFormData = z.infer<typeof taskFormSchema>;
// → { title: string; description: string; }
```

### Laravelバリデーションとの対比

```php
// Laravel
public function rules() {
    return [
        'title'       => 'required|string|max:100',
        'description' => 'nullable|string|max:500',
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
  description: z.string().max(500).default(''),
});
```

### React Hook Form と Zod の連携

`@hookform/resolvers` の `zodResolver` を使って、Zodスキーマを React Hook Form に接続します:

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// 次のセクション（5-4）で実際のファイルとして作成します

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from '../types/schema';

function TaskCreateForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema), // ← Zodスキーマを接続
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // registerにバリデーションルールを書く必要がない
  // すべてZodスキーマ側に集約されている
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('title')} />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}
      {/* ... */}
    </form>
  );
}
```

---

## 5-4. 再利用可能なフォームコンポーネント

### 汎用FormFieldコンポーネント

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

### 汎用Inputコンポーネント

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

### 完成版: TaskCreateForm

```tsx
// src/features/tasks/components/TaskCreateForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from '../types/schema';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type TaskCreateFormProps = {
  onSubmit: (data: TaskFormData) => void;
};

export function TaskCreateForm({ onSubmit }: TaskCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const handleFormSubmit = async (data: TaskFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} placeholder="タスク名を入力" />
      </FormField>

      <FormField label="説明" error={errors.description}>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="タスクの説明（任意）"
        />
      </FormField>

      <Button variant="primary" disabled={isSubmitting}>
        {isSubmitting ? '作成中...' : 'タスクを作成'}
      </Button>
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
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
    },
  });

  // taskが変わったらフォームをリセット
  useEffect(() => {
    reset({
      title: task.title,
      description: task.description,
    });
  }, [task, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} />
      </FormField>

      <FormField label="説明" error={errors.description}>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
```

---

## 5-6. 高度なZodパターン（参考）

以下は今後の実装で使えるパターンです。この章では実装しませんが、知っておくと便利です。

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

- [ ] React Hook Formの基本（register, handleSubmit, errors）を理解できた
- [ ] Zodでバリデーションスキーマを定義できる
- [ ] zodResolverでRHFとZodを連携できる
- [ ] z.inferでスキーマから型を自動生成できる
- [ ] 再利用可能なFormField/Inputコンポーネントを作成できた
- [ ] 作成フォームと編集フォームの両方が動作する
- [ ] isDirty, isSubmittingなどのフォーム状態を活用できる
- [ ] Laravelのバリデーションとの類似性を理解している
