import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5分間はキャッシュを新鮮とみなす
      retry: 1,                     // エラー時に1回リトライ
      refetchOnWindowFocus: true,   // ウィンドウフォーカスで再取得
    },
  },
});