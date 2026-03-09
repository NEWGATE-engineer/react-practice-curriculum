// メインレイアウト

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

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
};