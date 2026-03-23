import { apiClient } from '@/lib/api-client';
import type { Task } from '../types';

// モックAPIと同じインターフェース → 呼び出し側の変更不要
export const taskApi = {
  async getAll(): Promise<Task[]> {
    const { data } = await apiClient.get('/tasks');
    return data.data; // Laravelのリソースコレクション形式
  },

  async getById(id: string): Promise<Task> {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data.data;
  },

  async create(payload: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data } = await apiClient.post('/tasks', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.put(`/tasks/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};