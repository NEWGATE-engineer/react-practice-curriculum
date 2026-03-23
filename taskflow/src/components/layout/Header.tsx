import { useUIStore } from '@/stores/ui-store';

export function Header() {
  const toggleSidebar = useUIStore(state => state.toggleSidebar);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="サイドバー切り替え"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-gray-600">ゲストユーザー</span>
        </nav>
      </div>
    </header>
  );
}