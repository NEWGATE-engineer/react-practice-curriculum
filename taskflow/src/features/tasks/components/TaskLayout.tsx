import { Outlet } from "react-router-dom";

export function TaskLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          タスクの作成・管理を行います
        </p>
      </div>
      {/* 子ルートの内容がここに表示される */}
      <Outlet />
    </div>
  );
}