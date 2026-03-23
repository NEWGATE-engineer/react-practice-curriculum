import type { Task, TaskStatus } from '@/features/tasks/types';

// モックデータ
let mockTasks: Task[] = [
  {
    id: '1',
    title: 'プロジェクト計画書を作成',
    description: 'スコープと期限を決める',
    status: 'todo',
    priority: 'high',
    dueDate: '2025-02-01',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'デザインカンプを確認',
    description: 'Figmaで共有されたデザインをレビュー',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2025-01-20',
    createdAt: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    title: '開発環境構築',
    description: 'Docker + Viteの環境を整備',
    status: 'done',
    priority: 'low',
    dueDate: null,
    createdAt: '2025-01-03T00:00:00Z',
  },
];

// API遅延をシミュレーション
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// モックAPIの実装（Laravelの Controller に相当）
export const mockTaskApi = {
  // GET /api/tasks（index）
  async getAll(): Promise<Task[]> {
    await delay(500);
    return [...mockTasks];
  },

  // GET /api/tasks/:id（show）
  async getById(id: string): Promise<Task> {
    await delay(300);
    const task = mockTasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return { ...task };
  },

  // POST /api/tasks（store）
  async create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await delay(500);
    const newTask: Task = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    mockTasks = [newTask, ...mockTasks];
    return newTask;
  },

  // PUT /api/tasks/:id（update）
  async update(id: string, data: Partial<Task>): Promise<Task> {
    await delay(500);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');
    mockTasks[index] = { ...mockTasks[index], ...data };
    return { ...mockTasks[index] };
  },

  // DELETE /api/tasks/:id（destroy）
  async delete(id: string): Promise<void> {
    await delay(300);
    mockTasks = mockTasks.filter(t => t.id !== id);
  },
};