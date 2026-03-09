import { MainLayout } from "./components/layout/MainLayout";

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
};