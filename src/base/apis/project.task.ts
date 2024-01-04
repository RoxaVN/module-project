import {
  ApiSource,
  ArrayMaxSize,
  ExactProps,
  IsOptional,
  MinLength,
  PaginationRequest,
  TransformArray,
} from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';
import { TaskResponse } from './task.js';

const projectTaskSource = new ApiSource<TaskResponse>(
  [scopes.Project, scopes.Task],
  baseModule
);

class GetProjectRootTaskRequest extends ExactProps<GetProjectRootTaskRequest> {
  @MinLength(1)
  public readonly projectId!: string;
}

class GetProjectTasksRequest extends PaginationRequest<GetProjectTasksRequest> {
  @MinLength(1)
  public readonly projectId: string;

  @MinLength(1)
  @IsOptional()
  public readonly userId?: string;

  @MinLength(1, { each: true })
  @ArrayMaxSize(20)
  @TransformArray()
  @IsOptional()
  public readonly ids?: string[];
}

export const projectTaskApi = {
  getRoot: projectTaskSource.getOne({
    path: projectTaskSource.apiPath({ includeId: true }) + '/root-task',
    validator: GetProjectRootTaskRequest,
    permission: permissions.ReadProject,
  }),
  getMany: projectTaskSource.getMany({
    validator: GetProjectTasksRequest,
    permission: permissions.ReadTasks,
  }),
};
