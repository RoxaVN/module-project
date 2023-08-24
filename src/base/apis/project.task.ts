import {
  ApiSource,
  ArrayMaxSize,
  ExactProps,
  MinLength,
  TransformArray,
} from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';
import { TaskResponse } from './task.js';

const projectTaskSource = new ApiSource<TaskResponse>(
  [scopes.Project],
  baseModule
);

class GetProjectRootTaskRequest extends ExactProps<GetProjectRootTaskRequest> {
  @MinLength(1)
  public readonly projectId!: string;
}

class GetProjectRootTasksRequest extends ExactProps<GetProjectRootTasksRequest> {
  @MinLength(1)
  public readonly projectId: string;

  @MinLength(1, { each: true })
  @ArrayMaxSize(20)
  @TransformArray()
  public readonly ids: string[];
}

export const projectTaskApi = {
  getRoot: projectTaskSource.getOne({
    path: projectTaskSource.apiPath({ includeId: true }) + '/root-task',
    validator: GetProjectRootTaskRequest,
    permission: permissions.ReadProject,
  }),
  getSome: projectTaskSource.getAll({
    path: projectTaskSource.apiPath({ includeId: true }) + '/tasks',
    validator: GetProjectRootTasksRequest,
    permission: permissions.ReadTasks,
  }),
};
