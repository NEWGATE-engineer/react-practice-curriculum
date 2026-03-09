// メインレイアウト

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

// 型定義
// Reactでレンダリングできるものすべてを表す型です。
// React.ReactNode に含まれるもの
// ├── JSX要素         <div>, <Component /> など
// ├── 文字列          "テキスト"
// ├── 数値            42
// ├── 配列            [<div/>, <span/>]
// ├── null / undefined
// └── boolean
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
          {/* Laravelの{{ $slot }}と同じ。呼び出し先でMainLayoutタグで囲まれている中のコードが入ってくるイメージ */}
          {children}
        </main>
      </div>
    </div>
  );
};