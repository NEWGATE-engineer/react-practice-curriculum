import { useForm } from "react-hook-form";
import type { Task } from "../types";
import { taskFormSchema, type TaskFormData } from "../types/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

type TaskEditFormProps = {
  task: Task;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
};

export function TaskEditForm({task, onSubmit, onCancel}: TaskEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
    },
  });

  // taskが変わったらフォームをリセット
  useEffect(() => {
    reset({
      title: task.title,
      description: task.description,
    });
  }, [task, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} />
      </FormField>

      <FormField label="説明" error={errors.description}>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}