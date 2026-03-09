// ヘッダー

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