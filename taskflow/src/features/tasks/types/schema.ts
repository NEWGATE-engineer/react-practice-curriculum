import { z } from 'zod';

// Zodスキーマ定義（Laravelの FormRequest::rules() に相当）
export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, '100文字以内で入力してください'),
  description: z
    .string()
    .max(500, '500文字以内で入力してください'),
});

// スキーマから型を自動生成（手動で型定義する必要がない）
export type TaskFormData = z.infer<typeof taskFormSchema>;
