# 第1章: 環境構築とReactの基本

## この章のゴール
- 開発環境を構築し、Reactプロジェクトの構造を理解する
- JSX/TSXの書き方を理解する
- コンポーネントとPropsの基本を習得する
- Tailwind CSSでのスタイリングを始める

## 完成イメージ
TaskFlowアプリのトップページ（静的な画面）を作成します。

---

## 1-1. プロジェクト作成

### jQueryとの違い（まず理解すること）

jQuery時代:
```html
<!-- jQuery: HTMLを直接操作する -->
<div id="app">
  <h1 id="title">Hello</h1>
  <button id="btn">Click</button>
</div>
<script>
  $('#btn').on('click', function() {
    $('#title').text('Clicked!');
  });
</script>
```

React:
```tsx
// React: 状態に応じてUIが自動的に更新される
function App() {
  const [title, setTitle] = useState('Hello');
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setTitle('Clicked!')}>Click</button>
    </div>
  );
}
```

**核心的な違い:**
- jQuery = **命令的**（「この要素を探して、テキストを変えろ」）
- React = **宣言的**（「状態がこうなら、UIはこう表示される」）

Laravel の Blade テンプレートで `@if($user)` のように条件分岐を書いた経験があれば、
Reactの考え方は近いです。ただし、Reactはフロントエンドだけで完結します。

### Viteでプロジェクト作成

```bash
npm create vite@latest taskflow -- --template react-ts
cd taskflow
npm install
```

> **なぜVite？**
> - Create React App (CRA) は非推奨になりました
> - Viteは高速なビルドツールで、現場のデファクトスタンダードです
> - LaravelでもViteが採用されています（Laravel Vite）ので馴染みがあるはずです

### TypeScriptについて

PHPでの型ヒント:
```php
function greet(string $name): string {
    return "Hello, {$name}";
}
```

TypeScriptでの型:
```tsx
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

PHPの型ヒントを使った経験があれば、TypeScriptの型システムは自然に理解できます。
違いは「TypeScriptはコンパイル時に型チェックされる」点です。

### 初期ディレクトリ構成を整理

Viteが生成するデフォルト構成から、実践的な構成に変更します:

```bash
# 不要ファイルの削除
rm src/App.css src/index.css

# ディレクトリ作成
mkdir -p src/{app,components/ui,components/layout,features,hooks,lib,types,utils,styles}
```

### Tailwind CSSの導入

```bash
npm install -D tailwindcss @tailwindcss/vite
```

`src/styles/globals.css` を作成:
```css
@import "tailwindcss";
```

`vite.config.ts` を更新:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
```

`src/main.tsx` で読み込み:
```tsx
import './styles/globals.css';
```

### パスエイリアスの設定

`@/` で `src/` を参照できるようにします（現場でよく使われる設定）:

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`:
```ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... plugins
});
```

---

## 1-2. JSX/TSXの基本

### JSXとは

HTMLに似たJavaScriptの構文拡張です。Bladeテンプレートとの対比で理解しましょう:

**Blade:**
```php
<div class="container">
    <h1>{{ $title }}</h1>
    @if($items)
        <ul>
            @foreach($items as $item)
                <li>{{ $item->name }}</li>
            @endforeach
        </ul>
    @endif
</div>
```

**JSX/TSX:**
```tsx
<div className="container">
  <h1>{title}</h1>
  {items && (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )}
</div>
```

### JSXの重要ルール

```tsx
// 1. classではなくclassName（JSではclassは予約語）
<div className="text-red-500">赤いテキスト</div>

// 2. {}内にJavaScript式を書ける
<p>{1 + 1}</p>               // → 2
<p>{user.name}</p>            // → 変数の値
<p>{isAdmin ? '管理者' : '一般'}</p>  // → 三項演算子

// 3. returnは1つのルート要素のみ
// NG:
return (
  <h1>Title</h1>
  <p>Text</p>
);

// OK: フラグメント(<>...</>)で囲む
return (
  <>
    <h1>Title</h1>
    <p>Text</p>
  </>
);

// 4. style属性はオブジェクト（CSSプロパティはキャメルケース）
<div style={{ backgroundColor: 'blue', fontSize: '16px' }}>
```

---

## 1-3. コンポーネントとProps

### コンポーネント = 再利用可能なUI部品

LaravelのBladeコンポーネント(`<x-button>`)と同じ考え方です。

```tsx
// src/components/ui/Button.tsx

// Propsの型を定義（PHPの引数の型ヒントに相当）
type ButtonProps = {
  children: React.ReactNode;  // ボタンの中身（テキストや要素）
  variant?: 'primary' | 'secondary' | 'danger';  // ?はオプショナル
  onClick?: () => void;
};

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  // variantに応じたスタイルを切り替え
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 使用側:
```tsx
import { Button } from '@/components/ui/Button';

function App() {
  return (
    <div>
      <Button>デフォルト（primary）</Button>
      <Button variant="secondary">キャンセル</Button>
      <Button variant="danger" onClick={() => alert('削除!')}>削除</Button>
    </div>
  );
}
```

### Props と PHP の比較

```php
// PHP: コンストラクタで引数を受け取る
class Button {
    public function __construct(
        private string $label,
        private string $variant = 'primary'
    ) {}
}
```

```tsx
// React: 関数の引数としてPropsを受け取る
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
};

function Button({ label, variant = 'primary' }: ButtonProps) {
  return <button className={variant}>{label}</button>;
}
```

---

## 1-4. 実践: TaskFlowのベース画面を作る

### エントリーポイント

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

> **StrictMode とは？**
> 開発時のみ動作し、潜在的な問題を検出してくれます。
> 本番ビルドでは自動的に無効になります。

### レイアウトコンポーネント

```tsx
// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-gray-600">ゲストユーザー</span>
        </nav>
      </div>
    </header>
  );
}
```

```tsx
// src/components/layout/Sidebar.tsx
type SidebarProps = {
  items: { label: string; href: string }[];
};

export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-200"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

```tsx
// src/components/layout/MainLayout.tsx
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type MainLayoutProps = {
  children: React.ReactNode;
};

const sidebarItems = [
  { label: 'ダッシュボード', href: '/' },
  { label: 'タスク', href: '/tasks' },
  { label: 'プロジェクト', href: '/projects' },
];

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Appコンポーネント

```tsx
// src/app/App.tsx
import { MainLayout } from '@/components/layout/MainLayout';

export function App() {
  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ダッシュボード</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">未完了タスク</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">進行中</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">5</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">完了</p>
            <p className="text-3xl font-bold text-green-600 mt-1">24</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
```

---

## 1-5. ESLint + Prettier の設定

開発の最初から設定しておくことで、一貫したコードスタイルを保てます。

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

```js
// eslint.config.js
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

## 章末チェックリスト

- [ ] Vite + React + TypeScriptでプロジェクトを作成できた
- [ ] ディレクトリ構成を実践的な形に整理できた
- [ ] Tailwind CSSが動作している
- [ ] コンポーネントを作成し、Propsを渡せた
- [ ] Header, Sidebar, MainLayoutを組み合わせて画面が表示された
- [ ] ESLint + Prettierが動作している
- [ ] `npm run dev` でエラーなく表示されている

## jQuery経験者への補足

| jQuery | React |
|--------|-------|
| `$('#id').text('hello')` | `setState('hello')` → 自動で再描画 |
| `$('#id').addClass('active')` | `className={isActive ? 'active' : ''}` |
| `$('#id').show() / .hide()` | `{isVisible && <Component />}` |
| `$.ajax()` | `fetch()` / Axios / TanStack Query |
| プラグイン | npmパッケージ / カスタムフック |
| DOMを直接操作 | 状態を変更 → UIが自動更新 |
