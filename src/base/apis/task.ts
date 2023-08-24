import {
  ApiSource,
  ExactProps,
  IsOptional,
  IsPositive,
  MaxLength,
  Min,
  MinLength,
  TransformDate,
  TransformNumber,
} from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

export interface TaskResponse {
  id: string;
  userId: string;
  assignee?: string;
  parents?: string[];
  parentId?: string;
  childrenCount: number;
  progress: number;
  weight: number;
  childrenWeight: number;
  status: string;
  title: string;
  projectId: string;
  metadata?: any;
  createdDate: Date;
  updatedDate: Date;
  expiryDate: Date;
  startedDate?: Date;
  finishedDate?: Date;
  rejectedDate?: Date;
}

const taskSource = new ApiSource<TaskResponse>([scopes.Task], baseModule);

class CreateSubtaskRequest extends ExactProps<CreateSubtaskRequest> {
  @MinLength(1)
  public readonly taskId!: string;

  @MinLength(1)
  @MaxLength(2048)
  public readonly title!: string;

  @TransformDate()
  public readonly expiryDate!: Date;

  @IsPositive()
  public readonly weight: number;
}

const UpdateTaskRequest = CreateSubtaskRequest;

class GetSubtasksRequest extends ExactProps<GetSubtasksRequest> {
  @MinLength(1)
  public readonly taskId!: string;

  @Min(1)
  @TransformNumber()
  @IsOptional()
  public readonly page?: number;
}

class GetTaskRequest extends ExactProps<GetTaskRequest> {
  @MinLength(1)
  public readonly taskId!: string;
}

class DeleteTaskRequest extends ExactProps<DeleteTaskRequest> {
  @MinLength(1)
  public readonly taskId!: string;
}

class AssignTaskRequest extends ExactProps<AssignTaskRequest> {
  @MinLength(1)
  public readonly taskId!: string;

  @MinLength(1)
  public readonly userId!: string;
}

class AssignMeTaskRequest extends ExactProps<AssignMeTaskRequest> {
  @MinLength(1)
  public readonly taskId!: string;
}

class UpdateTaskStatusRequest extends ExactProps<UpdateTaskStatusRequest> {
  @MinLength(1)
  public readonly taskId!: string;
}

export const taskApi = {
  createSubtask: taskSource.create({
    path: taskSource.apiPath({ includeId: true }) + '/subtasks',
    validator: CreateSubtaskRequest,
    permission: permissions.CreateTask,
  }),
  getSubtasks: taskSource.getMany({
    path: taskSource.apiPath({ includeId: true }) + '/subtasks',
    validator: GetSubtasksRequest,
    permission: permissions.ReadTasks,
  }),
  update: taskSource.update({
    validator: UpdateTaskRequest,
    permission: permissions.UpdateTask,
  }),
  getOne: taskSource.getOne({
    validator: GetTaskRequest,
    permission: permissions.ReadTask,
  }),
  delete: taskSource.delete({
    validator: DeleteTaskRequest,
    permission: permissions.DeleteTask,
  }),
  assign: taskSource.update({
    path: taskSource.apiPath({ includeId: true }) + '/assign',
    validator: AssignTaskRequest,
    permission: permissions.AssignTask,
  }),
  assignMe: taskSource.update({
    path: taskSource.apiPath({ includeId: true }) + '/assignMe',
    validator: AssignMeTaskRequest,
    permission: permissions.AssignTask,
  }),

  inprogress: taskSource.update({
    path: taskSource.apiPath({ includeId: true }) + '/inprogress',
    validator: UpdateTaskStatusRequest,
    permission: permissions.UpdateTaskStatus,
  }),
  finish: taskSource.update({
    path: taskSource.apiPath({ includeId: true }) + '/finish',
    validator: UpdateTaskStatusRequest,
    permission: permissions.UpdateTaskStatus,
  }),
  reject: taskSource.update({
    path: taskSource.apiPath({ includeId: true }) + '/reject',
    validator: UpdateTaskStatusRequest,
    permission: permissions.UpdateTaskStatus,
  }),
};
