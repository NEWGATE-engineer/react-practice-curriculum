import { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import type { TaskFormData } from '../types/schema';
import { TaskCreateForm } from './TaskCreateForm';
import { TaskCard } from './TaskCard';

// 仮データ
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'プロジェクト計画書を作成',
    description: 'スコープと期限を決める',
    status: 'todo',
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    title: 'デザインカンプを確認',
    description: 'Figmaで共有されたデザインをレビュー',
    status: 'in_progress',
    createdAt: '2025-01-02',
  },
  {
    id: '3',
    title: '開発環境構築',
    description: 'Docker + Viteの環境を整備',
    status: 'done',
    createdAt: '2025-01-03',
  },
];

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  // TaskFormData を受け取って Task に変換して追加
  const handleCreate = (data: TaskFormData) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      status: 'todo',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">タスク一覧</h2>

      <div className="mb-6">
        <TaskCreateForm onSubmit={handleCreate} />
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            タスクがありません。最初のタスクを追加しましょう！
          </p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}