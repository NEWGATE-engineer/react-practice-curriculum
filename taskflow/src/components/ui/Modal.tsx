import type React from "react";
import { useEffect, useRef } from "react";

// Propsの定義
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  //　overlay参照（ref）を作成
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escキーで閉じる
  useEffect(() => {
    // ESCキーが押されたときの処理
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(); // ESCならonCloseを呼ぶ 
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc); // キー監視を開始
      document.body.style.overflow = 'hidden'; // スクロール防止
    }

    return () => {
      document.removeEventListener('keydown', handleEsc); // キー監視を解除
      document.body.style.overflow = ''; // スクロール禁止を解除
    }
  }, [isOpen, onClose]); // isOpenかonCloseが変わるたびに実行

  // isOpenがfalseだったらNULLを返す
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        // オーバーレイ（背景）クリックで閉じる
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}