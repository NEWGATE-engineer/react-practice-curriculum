import type { TaskStatus } from "../types";

type FilterOption = TaskStatus | 'all';

type TaskFilterTabsProps = {
  current: FilterOption;
  onChange: (filter: FilterOption) => void;
  counts: Record<FilterOption, number>;
};

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
];

export function TaskFilterTabs({ current, onChange, counts }: TaskFilterTabsProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${current === option.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          {option.label}
          <span className="ml-1 text-xs text-gray-400">
            ({counts[option.value]})
          </span>
        </button>
      ))}
    </div>
  );
}