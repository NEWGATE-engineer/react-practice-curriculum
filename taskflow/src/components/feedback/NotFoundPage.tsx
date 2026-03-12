import { Link } from "react-router-dom";


export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500 mt-4">ページが見つかりません</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ダッシュボードに戻る
      </Link>
    </div>
  );
}