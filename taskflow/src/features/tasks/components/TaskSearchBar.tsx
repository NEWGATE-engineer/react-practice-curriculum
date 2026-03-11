import { useEffect, useRef } from "react";

type TaskSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TaskSearchBar({ value, onChange }: TaskSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ページ遷移時に自動フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="タスクを検索..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  );
}