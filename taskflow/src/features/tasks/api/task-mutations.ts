import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockTaskApi } from '@/mocks/tasks';
import { taskKeys } from './task-queries';
import type { Task } from '../types';

// タスク作成
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockTaskApi.create,
    onSuccess: () => {
      // 成功時にタスク一覧のキャッシュを無効化 → 自動再取得
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// タスク更新
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      mockTaskApi.update(id, data),
    onSuccess: (updatedTask) => {
      // キャッシュを直接更新（再リクエスト不要で高速）
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id),
        updatedTask
      );
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// タスク削除
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockTaskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}