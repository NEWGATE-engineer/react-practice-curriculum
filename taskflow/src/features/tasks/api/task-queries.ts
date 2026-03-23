import { useQuery } from '@tanstack/react-query';
import { mockTaskApi } from '@/mocks/tasks';

// クエリキーの定数化（キャッシュの識別子）
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// タスク一覧取得フック
export function useTaskList() {
  return useQuery({
    queryKey: taskKeys.lists(),    // キャッシュキー
    queryFn: mockTaskApi.getAll,   // データ取得関数
  });
}

// タスク詳細取得フック
export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => mockTaskApi.getById(taskId),
    enabled: !!taskId,  // taskIdがある場合のみ実行
  });
}