# 第12章: 総仕上げとデプロイ

## この章のゴール
- エラーハンドリングを整備する
- ESLint + Prettierで品質を担保する
- 本番ビルドとデプロイを実施する
- Git運用の実践的なフローを理解する
- これまでの学習を振り返り、次のステップを知る

## 完成イメージ
TaskFlowアプリが品質の高い状態でデプロイ可能になる。

## 作業順序

1. `src/components/feedback/ErrorBoundary.tsx` 作成 — Error Boundary（依存なし）（12-1）
2. `src/app/App.tsx` 更新 — ErrorBoundaryでアプリ全体を囲む ※ErrorBoundaryに依存（12-1）
3. `src/lib/api-client.ts` 更新 — レスポンスインターセプターにエラーハンドリングを追加（12-1）
4. `eslint`, `prettier`, `eslint-config-prettier` 等の設定を確認・調整（12-2）
5. `husky`, `lint-staged` をインストール＆設定 — pre-commitフック（12-2）
6. `.env` / `.env.example` 作成 — 環境変数の設定（12-3）
7. `package.json` 更新 — lint:fix, format, typecheck 等のスクリプト追加（12-2）
8. `npm run build` でビルド確認（12-4）
9. `rollup-plugin-visualizer` でバンドルサイズ分析（12-4）
10. Vercel または Netlify にデプロイ（12-5）

---

## 12-1. エラーハンドリング

### Error Boundary

React コンポーネントのレンダリング中にエラーが発生した場合のフォールバックUI:

```tsx
// src/components/feedback/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログをサービスに送信（Sentry等）
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            予期しないエラーが発生しました
          </h2>
          <p className="text-gray-500 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

> **なぜクラスコンポーネント？**
> Error Boundaryは現時点ではクラスコンポーネントでしか実装できません。
> React 19以降では関数コンポーネントでも対応予定ですが、
> 現場ではこのパターンか、`react-error-boundary` ライブラリを使います。

### アプリ全体に適用

```tsx
// src/app/App.tsx
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { Providers } from './providers';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  );
}
```

### API エラーハンドリングの統一

```tsx
// src/lib/api-client.ts のインターセプターに追加
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 400:
        console.error('リクエストエラー:', message);
        break;
      case 401:
        // 認証エラー（第10章で実装済み）
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
        break;
      case 403:
        console.error('権限がありません');
        break;
      case 404:
        console.error('リソースが見つかりません');
        break;
      case 422:
        // バリデーションエラー（Laravelの形式）
        console.error('バリデーションエラー:', error.response?.data?.errors);
        break;
      case 500:
        console.error('サーバーエラーが発生しました');
        break;
    }

    return Promise.reject(error);
  }
);
```

---

## 12-2. ESLint + Prettier の仕上げ

### npm scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

### Pre-commit Hook（Husky + lint-staged）

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json に追加
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

> **Laravelとの対比:**
> Laravel Pintに相当する仕組みです。
> コミット前に自動でフォーマット・Lintチェックが走ります。

---

## 12-3. 環境変数

```bash
# .env（ローカル開発用）
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=TaskFlow

# .env.production（本番用）
VITE_API_URL=https://api.taskflow.example.com/api
VITE_APP_NAME=TaskFlow
```

```tsx
// ※ 概念説明用コード（ファイルには書きません）
// 使用側
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

> **重要:** Viteでは `VITE_` プレフィックスがついた環境変数のみがクライアントに公開されます。
> 秘密情報（APIキー等）は絶対に `VITE_` を付けないでください。

```gitignore
# .gitignore に追加
.env
.env.local
.env.production.local
```

---

## 12-4. ビルドと最適化

### 本番ビルド

```bash
npm run build
```

ビルド結果を確認:
```
dist/
├── index.html
└── assets/
    ├── index-[hash].js        # メインバンドル
    ├── TaskListPage-[hash].js  # Code Splitting されたチャンク
    ├── index-[hash].css        # CSS
    └── ...
```

### バンドルサイズの分析

```bash
npm install -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... 既存のプラグイン
    visualizer({ open: true }),  // ビルド時にサイズを可視化
  ],
});
```

---

## 12-5. デプロイ

### Vercel（推奨・最も簡単）

```bash
npm install -g vercel
vercel
```

1. GitHubリポジトリと連携
2. フレームワーク: Vite を選択
3. ビルドコマンド: `npm run build`
4. 出力ディレクトリ: `dist`
5. 自動デプロイ完了

### Netlify

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> **SPAのリダイレクト設定:**
> SPAでは全てのURLを `index.html` にリダイレクトする必要があります。
> React Routerがブラウザ側でルーティングを処理するためです。

---

## 12-6. Git運用（Feature Branch Flow）

### ブランチ戦略

```
main（本番環境）
  └── develop（開発環境）
       ├── feature/task-list    ← 機能開発
       ├── feature/auth         ← 機能開発
       ├── fix/task-status-bug  ← バグ修正
       └── refactor/hooks       ← リファクタリング
```

### 実践的なGitフロー

```bash
# 1. 新機能の開発を始める
git checkout develop
git pull origin develop
git checkout -b feature/task-filter

# 2. 作業する
# ... コーディング ...

# 3. コミット（こまめに）
git add src/features/tasks/components/TaskFilterTabs.tsx
git commit -m "feat: タスクフィルタータブを追加"

git add src/features/tasks/hooks/useTaskFilter.ts
git commit -m "feat: タスクフィルタリングロジックを追加"

# 4. プッシュ
git push origin feature/task-filter

# 5. Pull Request を作成
# GitHubでPRを作成 → コードレビュー → マージ
```

### コミットメッセージの規約

```
feat: 新機能を追加
fix: バグを修正
refactor: リファクタリング（機能変更なし）
style: コードスタイルの変更（動作に影響なし）
test: テストの追加・修正
docs: ドキュメントの変更
chore: ビルドプロセスや補助ツールの変更
```

---

## 12-7. 最終的なプロジェクト構成

```
taskflow/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── FormField.tsx
│   │   │   └── __tests__/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── RootLayout.tsx
│   │   └── feedback/
│   │       ├── ErrorBoundary.tsx
│   │       ├── NotFoundPage.tsx
│   │       ├── ToastContainer.tsx
│   │       └── PageLoading.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── tasks/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   └── projects/
│   │       └── ...
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── __tests__/
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── query-client.ts
│   ├── stores/
│   │   ├── ui-store.ts
│   │   └── toast-store.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── format-date.ts
│   │   └── __tests__/
│   ├── styles/
│   │   └── globals.css
│   ├── mocks/
│   │   └── tasks.ts
│   ├── test/
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## 12-8. 学習のまとめと次のステップ

### このカリキュラムで学んだこと

| 章 | スキル | 対応するLaravel知識 |
|----|--------|-------------------|
| 1 | React + TypeScript + Tailwind | Blade + CSS |
| 2 | useState, イベント | jQuery, Session |
| 3 | useEffect, useRef, コンポーネント設計 | ライフサイクル, Bladeコンポーネント |
| 4 | React Router | web.php ルーティング |
| 5 | React Hook Form + Zod | FormRequest + バリデーション |
| 6 | TanStack Query + Axios | Eloquent + API Resource |
| 7 | Zustand, useContext, useReducer | Service Container, Session |
| 8 | 全use系Hook + カスタムフック | Trait, Helper |
| 9 | パフォーマンス最適化 | キャッシュ, クエリ最適化 |
| 10 | 認証 + ルートガード | Sanctum + Middleware |
| 11 | テスト | PHPUnit |
| 12 | 品質管理 + デプロイ | Pint + Forge/Vapor |

### 次のステップ（発展学習）

1. **Next.js** — React のフルスタックフレームワーク（SSR, SSG）
2. **React Server Components** — サーバーサイドでのコンポーネントレンダリング
3. **Playwright** — E2Eテスト
4. **Storybook** — UIコンポーネントのカタログ
5. **Docker** — 開発環境のコンテナ化
6. **CI/CD** — GitHub Actionsでの自動テスト・デプロイ
7. **アクセシビリティ** — WAI-ARIA、キーボードナビゲーション
8. **国際化 (i18n)** — react-intl, next-intl

---

## 章末チェックリスト

- [ ] Error Boundaryでエラーをキャッチし、フォールバックUIを表示できる
- [ ] ESLint + Prettierが正しく動作している
- [ ] 環境変数を適切に管理できている
- [ ] 本番ビルドが成功する
- [ ] デプロイが完了している（Vercel / Netlify）
- [ ] Git ブランチ戦略を理解し、PRベースの開発ができる
- [ ] コミットメッセージの規約に従っている
- [ ] TaskFlowアプリが全機能動作している
