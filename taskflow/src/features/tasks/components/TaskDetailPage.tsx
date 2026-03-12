import { useNavigate, useParams } from "react-router-dom";


export function TaskDetailPage() {
  // URLの :taskId 部分を取得
  // /tasks/abc123 → taskId = 'abc123'
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  // 後の章でAPIから取得するようにリファクタリングします
  // ここではダミーデータで表示

  return (
    <div>
      <button
        onClick={() => navigate('/tasks')}
        className="text-blue-600 hover:text-blue-800 mb-4"
      >
        ← タスク一覧に戻る
      </button>
      <h2 className="text-2xl font-bold">タスク詳細: {taskId}</h2>
      {/* 詳細内容 */}
    </div>
  );
}