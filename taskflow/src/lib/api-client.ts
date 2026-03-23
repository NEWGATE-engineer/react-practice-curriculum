import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
});

// リクエストインターセプター（認証トークンの付与）
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター（共通エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラー → ログインページへ（第10章で実装）
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);