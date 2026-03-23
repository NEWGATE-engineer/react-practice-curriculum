import { create } from "zustand";
import type { TaskStatus } from "../types";

type FilterOption = TaskStatus | 'all';

type TaskFilterState = {
  // 状態
  filter: FilterOption;
  searchQuery: string;

  // アクション
  setFilter: (filter: FilterOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  // 初期状態
  filter: 'all',
  searchQuery: '',

  // アクション（setでstateを更新）
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ filter: 'all', searchQuery: '' }),
}));