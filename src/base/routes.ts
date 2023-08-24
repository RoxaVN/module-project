import { Empty, WebRoute } from '@roxavn/core/base';

export const webRoutes = {
  Task: new WebRoute<{ taskId: string }, Empty>('/apps/projects/tasks/:taskId'),
  Project: new WebRoute<{ projectId: string }, Empty>(
    '/apps/projects/:projectId'
  ),
};
