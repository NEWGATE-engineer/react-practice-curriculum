import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { TaskListPage } from '@/features/tasks/components/TaskListPage';
import { TaskDetailPage } from '@/features/tasks/components/TaskDetailPage';
import { ProjectListPage } from '@/features/projects/components/ProjectListPage';
import { NotFoundPage } from '@/components/feedback/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />, // 共通レイアウト
    children: [
      { index: true, element: <DashboardPage /> },         // /
      { path: 'tasks', element: <TaskListPage /> },        // /tasks
      { path: 'tasks/:taskId', element: <TaskDetailPage /> }, // /tasks/123
      { path: 'projects', element: <ProjectListPage /> },  // /projects
      { path: '*', element: <NotFoundPage /> },            // 404ページ
    ],
  }
]);