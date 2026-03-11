import { Modal } from "@/components/ui/Modal";
import type { Task } from "../types";

// Propsの定義
type TaskDetailModalProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
};

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">説明</label>
          <p className="mt-1 text-gray-900">
            {task.description || '説明なし'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">ステータス</label>
          <p className="mt-1">{task.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">作成日</label>
          <p className="mt-1">{task.createdAt}</p>
        </div>
      </div>
    </Modal>
  );
}