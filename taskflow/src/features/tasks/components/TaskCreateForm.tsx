import { useForm } from "react-hook-form";
import { taskFormSchema, type TaskFormData } from '../types/schema';
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type TaskCreateFormProps = {
  onSubmit: (data: TaskFormData) => void;
}

export function TaskCreateForm({ onSubmit }: TaskCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const handleFormSubmit = async (data: TaskFormData) => {
    onSubmit(data);
    reset();
  }

  return(
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField label="タイトル" error={errors.title}>
        <Input {...register('title')} hasError={!!errors.title} placeholder="タスク名を入力" />
      </FormField>

      <FormField label="説明" error={errors.description}>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="タスクの説明（任意）"
        />
      </FormField>

      <Button variant="primary" disabled={isSubmitting}>
        {isSubmitting ? '作成中...' : 'タスクを作成'}
      </Button>
    </form>
  );
};