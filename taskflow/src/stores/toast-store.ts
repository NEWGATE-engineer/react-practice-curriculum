import { create } from "zustand";

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type ToastState = {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type) => {
    const id = Date.now().toString();
    set(state => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // 3秒後に自動で消す
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));