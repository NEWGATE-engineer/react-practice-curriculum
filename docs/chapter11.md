# 第11章: テスト

## この章のゴール
- Vitest でユニットテストを書けるようになる
- React Testing Library でコンポーネントテストを書けるようになる
- テスト設計の考え方を身につける
- TaskFlowの主要機能にテストを追加する

## 完成イメージ
主要なコンポーネント・フック・ユーティリティにテストが書かれた状態。

## 作業順序

1. `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` をインストール（11-2）
2. `vite.config.ts` 更新 — test設定を追加（11-2）
3. `src/test/setup.ts` 作成 — テストセットアップ（依存なし）（11-2）
4. `tsconfig.app.json` 更新 — テスト用の型追加（11-2）
5. `package.json` 更新 — test系スクリプト追加（11-2）
6. `src/utils/format-date.ts` 作成 — テスト対象のユーティリティ（依存なし）（11-3）
7. `src/utils/__tests__/format-date.test.ts` 作成 — ユニットテスト ※format-dateに依存（11-3）
8. `src/components/ui/__tests__/Button.test.tsx` 作成 — コンポーネントテスト（11-4）
9. `src/features/tasks/components/__tests__/TaskCard.test.tsx` 作成（11-4）
10. `src/features/tasks/components/__tests__/TaskCreateForm.test.tsx` 作成（11-5）
11. `src/hooks/__tests__/useDebounce.test.ts` 作成 — カスタムフックテスト（11-6）
12. `src/test/test-utils.tsx` 作成 — テストヘルパー（renderWithProviders）（11-7）

---

## 11-1. テストの種類と戦略

### テストピラミッド

```
      /  E2E テスト  \        ← 少ない（Playwright等。本カリキュラムでは扱わない）
     /  統合テスト     \       ← 中程度（コンポーネント間の連携）
    /  ユニットテスト    \      ← 多い（関数・フック・コンポーネント単体）
```

### Laravelのテストとの対比

```php
// Laravel: PHPUnit
class TaskTest extends TestCase
{
    public function test_タスクを作成できる(): void
    {
        $response = $this->postJson('/api/tasks', [
            'title' => 'テストタスク',
        ]);
        $response->assertStatus(201);
    }
}
```

```tsx
// React: Vitest + React Testing Library
describe('TaskCreateForm', () => {
  test('タスクを作成できる', async () => {
    const onSubmit = vi.fn();
    render(<TaskCreateForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('タイトル'), 'テストタスク');
    await userEvent.click(screen.getByRole('button', { name: 'タスクを作成' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'テストタスク' })
    );
  });
});
```

---

## 11-2. 環境構築

### インストール

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/testing-library__jest-dom
```

### 設定ファイル

```ts
// vite.config.ts に追記
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // ... 既存設定
  test: {
    globals: true,           // describe, test, expect をグローバルに
    environment: 'jsdom',    // ブラウザ環境をエミュレート
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

```json
// tsconfig.app.json の compilerOptions に追記
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

```json
// package.json のscriptsに追記
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 11-3. ユニットテスト — ユーティリティ関数

最も簡単なテストから始めましょう:

```tsx
// src/utils/format-date.ts
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
```

```tsx
// src/utils/__tests__/format-date.test.ts
import { formatDate, isOverdue } from '../format-date';

describe('formatDate', () => {
  test('日本語形式でフォーマットされる', () => {
    expect(formatDate('2025-01-15')).toBe('2025/01/15');
  });

  test('ISO文字列でも正しくフォーマットされる', () => {
    expect(formatDate('2025-01-15T10:30:00Z')).toMatch(/2025\/01\/1[45]/);
  });
});

describe('isOverdue', () => {
  test('期限切れの場合trueを返す', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
  });

  test('将来の日付の場合falseを返す', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });

  test('nullの場合falseを返す', () => {
    expect(isOverdue(null)).toBe(false);
  });
});
```

### テスト実行

```bash
npm test
# ファイル保存時に自動で再実行（ウォッチモード）

npm run test:run
# 1回だけ実行
```

---

## 11-4. コンポーネントテスト — React Testing Library

### テストの基本方針

React Testing Libraryは「ユーザーの視点でテストする」ことを重視:
- 実装の詳細（state, メソッド名）ではなく、ユーザーに見える振る舞いをテスト
- `getByRole`, `getByText`, `getByLabelText` でDOMを取得（実装に依存しない）

### Buttonコンポーネントのテスト

```tsx
// src/components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  test('childrenのテキストが表示される', () => {
    render(<Button>送信</Button>);
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  test('クリック時にonClickが呼ばれる', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disabledの場合クリックできない', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>無効</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### タスクカードのテスト

```tsx
// src/features/tasks/components/__tests__/TaskCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../types';

const mockTask: Task = {
  id: '1',
  title: 'テストタスク',
  description: 'テスト用の説明',
  status: 'todo',
  priority: 'medium',
  dueDate: '2025-12-31',
  createdAt: '2025-01-01T00:00:00Z',
};

describe('TaskCard', () => {
  test('タスクのタイトルと説明が表示される', () => {
    render(<TaskCard task={mockTask} onStatusChange={vi.fn()} />);

    expect(screen.getByText('テストタスク')).toBeInTheDocument();
    expect(screen.getByText('テスト用の説明')).toBeInTheDocument();
  });

  test('ステータスボタンをクリックするとonStatusChangeが呼ばれる', async () => {
    const handleStatusChange = vi.fn();
    render(<TaskCard task={mockTask} onStatusChange={handleStatusChange} />);

    await userEvent.click(screen.getByText('未着手'));
    expect(handleStatusChange).toHaveBeenCalledWith('1', 'in_progress');
  });
});
```

---

## 11-5. フォームのテスト

```tsx
// src/features/tasks/components/__tests__/TaskCreateForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCreateForm } from '../TaskCreateForm';

describe('TaskCreateForm', () => {
  test('バリデーションエラーが表示される', async () => {
    render(<TaskCreateForm onSubmit={vi.fn()} />);

    // 空のまま送信
    await userEvent.click(screen.getByRole('button', { name: 'タスクを作成' }));

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
    });
  });

  test('正常に送信できる', async () => {
    const handleSubmit = vi.fn();
    render(<TaskCreateForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText('タイトル'), '新しいタスク');
    await userEvent.type(screen.getByLabelText('説明'), 'タスクの詳細');
    await userEvent.click(screen.getByRole('button', { name: 'タスクを作成' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新しいタスク',
          description: 'タスクの詳細',
        })
      );
    });
  });

  test('100文字を超えるタイトルはエラーになる', async () => {
    render(<TaskCreateForm onSubmit={vi.fn()} />);

    const longTitle = 'a'.repeat(101);
    await userEvent.type(screen.getByLabelText('タイトル'), longTitle);
    await userEvent.click(screen.getByRole('button', { name: 'タスクを作成' }));

    await waitFor(() => {
      expect(screen.getByText('100文字以内で入力してください')).toBeInTheDocument();
    });
  });
});
```

---

## 11-6. カスタムフックのテスト

```tsx
// src/hooks/__tests__/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('指定した遅延後に値が更新される', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // 初期値
    expect(result.current).toBe('initial');

    // 値を変更
    rerender({ value: 'updated', delay: 300 });

    // まだ更新されていない
    expect(result.current).toBe('initial');

    // 300ms経過
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 更新された
    expect(result.current).toBe('updated');
  });
});
```

---

## 11-7. テストのベストプラクティス

### テストヘルパーの作成

```tsx
// src/test/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// テスト用のラッパー（Provider等を自動で適用）
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },     // テストではリトライしない
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// カスタムrender（Providerを自動適用）
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// re-export
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

### テストファイルの命名・配置規則

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       └── __tests__/
│           └── Button.test.tsx
├── features/
│   └── tasks/
│       ├── components/
│       │   ├── TaskCard.tsx
│       │   └── __tests__/
│       │       └── TaskCard.test.tsx
│       └── hooks/
│           ├── useTaskFilter.ts
│           └── __tests__/
│               └── useTaskFilter.test.ts
└── utils/
    ├── format-date.ts
    └── __tests__/
        └── format-date.test.ts
```

### 何をテストすべきか

```
テストすべき:
  ✅ ユーティリティ関数（純粋関数）
  ✅ カスタムフック（ロジック）
  ✅ フォームのバリデーション
  ✅ 条件分岐によるUI表示の切り替え
  ✅ ユーザーインタラクション（クリック、入力）

テスト不要:
  ❌ 静的なテキスト表示のみ
  ❌ CSSのスタイリング
  ❌ サードパーティライブラリの内部動作
  ❌ TypeScriptの型チェック（コンパイラが検証）
```

---

## 章末チェックリスト

- [ ] Vitestの環境を構築し、テストが実行できる
- [ ] ユーティリティ関数のユニットテストを書ける
- [ ] React Testing Libraryでコンポーネントをレンダリングしてテストできる
- [ ] userEventでユーザー操作をシミュレーションできる
- [ ] waitForで非同期の結果を待てる
- [ ] カスタムフックのテストをrenderHookで書ける
- [ ] テストヘルパー（renderWithProviders）を使い回せる
- [ ] vi.fn()でモック関数を作成しアサーションできる
