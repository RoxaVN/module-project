import { LoaderArgs } from '@remix-run/node';
import { servicesLoader } from '@roxavn/core/server';
import { ApiRolesGetter, useLoaderData, useResource } from '@roxavn/core/web';
import { takeRight } from 'lodash-es';

import {
  GetProjectApiService,
  GetProjectTasksApiService,
  GetSubtasksApiService,
  GetTaskApiService,
} from '../../../../../server/index.js';
import {
  ParentTasks,
  ProjectInfo,
  Subtasks,
  TaskInfo,
} from '../../../../components/index.js';
import { scopes, taskApi } from '../../../../../base/index.js';

export default function () {
  const data = useLoaderData<typeof loader>();
  const params = scopes.Project.makeScopeParams(data.project.id);
  useResource(scopes.Task, data.task);

  return (
    <div>
      <ApiRolesGetter apiParams={params} />
      <ProjectInfo project={data.project} />
      <ParentTasks parentTasks={data.parentTasks} />
      <TaskInfo task={data.task} />
      <Subtasks subtasks={data.subtasks} task={data.task} />
    </div>
  );
}

export function loader(args: LoaderArgs) {
  return servicesLoader.load(
    args,
    {
      task: {
        service: GetTaskApiService,
      },
      project: {
        service: GetProjectApiService,
        params: (data) => ({
          projectId: data.task.projectId,
        }),
      },
      parentTasks: {
        service: GetProjectTasksApiService,
        params: (data) => ({
          projectId: data.task.projectId,
          ids: takeRight(data.task.parents, 10) || [],
        }),
      },
      subtasks: {
        service: GetSubtasksApiService,
      },
    },
    {
      api: taskApi.getOne,
    }
  );
}
