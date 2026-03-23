export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;       // 追加
  dueDate: string | null;       // 追加
  createdAt: string;
};