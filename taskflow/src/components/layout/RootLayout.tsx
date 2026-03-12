import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function RootLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Outlet: 子ルートのコンポーネントがここに表示される */}
          {/* Bladeの @yield('content') に相当 */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}