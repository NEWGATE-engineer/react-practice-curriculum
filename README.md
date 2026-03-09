# React 実践カリキュラム — タスク管理アプリ「TaskFlow」

## 概要

PHP/Laravel/jQuery経験者がReact + TypeScriptを体系的に学ぶためのカリキュラムです。
「TaskFlow」というタスク管理アプリを1から段階的に構築しながら、現場で必要なスキルを身につけます。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| ルーティング | React Router v6 |
| 状態管理 | Zustand |
| サーバー状態 | TanStack Query (React Query) |
| フォーム | React Hook Form + Zod |
| スタイリング | Tailwind CSS |
| テスト | Vitest + React Testing Library |
| Linter/Formatter | ESLint + Prettier |
| API | REST API（モック → Laravel連携） |

## 最終的なディレクトリ構成

```
src/
├── app/                    # アプリ全体の設定
│   ├── App.tsx             # ルートコンポーネント
│   ├── router.tsx          # ルーティング定義
│   └── providers.tsx       # プロバイダー集約
├── components/             # 共通UIコンポーネント
│   ├── ui/                 # 汎用UI（Button, Input, Modal等）
│   ├── layout/             # レイアウト（Header, Sidebar等）
│   └── feedback/           # フィードバック（Toast, Loading等）
├── features/               # 機能別モジュール
│   ├── auth/               # 認証機能
│   │   ├── components/     # 認証用コンポーネント
│   │   ├── hooks/          # 認証用カスタムフック
│   │   ├── api/            # 認証API呼び出し
│   │   ├── stores/         # 認証用ストア
│   │   ├── types/          # 認証用型定義
│   │   └── index.ts        # 公開API（バレルエクスポート）
│   ├── tasks/              # タスク機能
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── stores/
│   │   ├── types/
│   │   └── index.ts
│   └── projects/           # プロジェクト機能
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── stores/
│       ├── types/
│       └── index.ts
├── hooks/                  # 共通カスタムフック
├── lib/                    # 外部ライブラリの設定・ラッパー
│   ├── api-client.ts       # Axiosインスタンス
│   └── query-client.ts     # TanStack Query設定
├── types/                  # グローバル型定義
├── utils/                  # ユーティリティ関数
├── styles/                 # グローバルスタイル
├── mocks/                  # モックデータ・MSW
├── test/                   # テストユーティリティ
├── main.tsx                # エントリーポイント
└── vite-env.d.ts           # Vite型定義
```

## カリキュラム構成（全12章）

### Phase 1: 基礎固め（第1章〜第3章）

| 章 | タイトル | 学習内容 |
|----|---------|---------|
| 1 | 環境構築とReactの基本 | Vite, TSX, コンポーネント, Props, Tailwind CSS |
| 2 | イベントとState管理 | useState, イベント処理, 条件分岐レンダリング, リスト描画 |
| 3 | コンポーネント設計とライフサイクル | useEffect, useRef, コンポーネント分割, children |

### Phase 2: 実践機能の構築（第4章〜第7章）

| 章 | タイトル | 学習内容 |
|----|---------|---------|
| 4 | ルーティングとレイアウト | React Router v6, ネストルート, レイアウトコンポーネント |
| 5 | フォームとバリデーション | React Hook Form, Zod, カスタムフォームコンポーネント |
| 6 | API連携とサーバー状態管理 | TanStack Query, Axios, モックAPI, CRUD操作 |
| 7 | グローバル状態管理 | Zustand, useContext, useReducer, 状態設計 |

### Phase 3: 高度なパターン（第8章〜第10章）

| 章 | タイトル | 学習内容 |
|----|---------|---------|
| 8 | カスタムフックとuse系Hook完全攻略 | useMemo, useCallback, useId, useDeferredValue, etc. |
| 9 | パフォーマンス最適化 | React.memo, コード分割, Suspense, useTransition |
| 10 | 認証とルートガード | 認証フロー, Protected Route, トークン管理 |

### Phase 4: 品質と仕上げ（第11章〜第12章）

| 章 | タイトル | 学習内容 |
|----|---------|---------|
| 11 | テスト | Vitest, React Testing Library, テスト設計 |
| 12 | 総仕上げとデプロイ | ESLint/Prettier, エラーハンドリング, ビルド, デプロイ |

---

各章の詳細は `docs/` ディレクトリ内の各ファイルを参照してください。
