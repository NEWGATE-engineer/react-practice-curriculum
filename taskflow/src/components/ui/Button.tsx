import type React from "react";

type ButtonProps = {
  children: React.ReactNode; // ボタンの中身（テキストや要素）
  variant?: 'primary' | 'secondary' | 'danger';  // ?はオプショナル
  onClick?: () => void;
};

export function Button({ children, variant = "primary", onClick }: ButtonProps) {
  // variantに応じたスタイルを切り替え
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}