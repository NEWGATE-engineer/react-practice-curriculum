// タスクカード

import type { Task, TaskStatus } from "../types";

// 型定義
// 「関数」を受け取るプロパティです。
// onStatusChange
// ├── 引数1: id（string）
// ├── 引数2: status（TaskStatus）
// └── 戻り値: void（何も返さない）
type TaskCardProps = {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
};

// statusConfigの内容を変えられないようにするためにas constを付けている
const statusConfig = {
  todo: { label: '未着手', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-700' },
  done: { label: '完了', color: 'bg-green-100 text-green-700' },
} as const;

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const config = statusConfig[task.status];

  // ステータスを押すたびに次のステータスへ循環するための対応表です。
  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        </div>
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}
        >
          {config.label}
        </button>
      </div>
    </div>
  );
}