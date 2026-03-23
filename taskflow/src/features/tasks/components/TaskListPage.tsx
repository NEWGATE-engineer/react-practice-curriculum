import { useTaskList } from '../api/task-queries';
import { TaskCard } from './TaskCard';
import type { TaskStatus } from '../types';

export function TaskListPage() {
  const { data: tasks, isLoading, isError, error } = useTaskList();

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // エラー表示
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  const handleStatusChange = (id: string, status: TaskStatus) => {
    // TODO: chapter 6-6 で useMutation に置き換え
    console.log('status change', id, status);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">タスク一覧</h2>
      <div className="space-y-3">
        {tasks?.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}