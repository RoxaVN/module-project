import { type InferApiRequest, NotFoundException } from '@roxavn/core/base';
import {
  AuthUser,
  BaseService,
  CheckRoleUsersApiService,
  DatabaseService,
  type InferContext,
  inject,
  InjectDatabaseService,
  databaseUtils,
} from '@roxavn/core/server';
import dayjs from 'dayjs';
import { In, IsNull } from 'typeorm';

import {
  AlreadyAssignedTaskException,
  constants,
  DeleteTaskException,
  FinishParenttaskException,
  FinishSubtaskException,
  InprogressTaskException,
  InvalidExpiryDateSubtaskException,
  InvalidTaskStatusForUpdateException,
  RejectTaskException,
  scopes,
  taskApi,
  UnassignedTaskException,
  UserNotInProjectException,
} from '../../base/index.js';
import { Task } from '../entities/index.js';
import { serverModule } from '../module.js';

const statusForUpdate = [
  constants.TaskStatus.PENDING,
  constants.TaskStatus.INPROGRESS,
];

@serverModule.injectable()
export class CreateSubtaskService extends InjectDatabaseService {
  async handle(request: {
    taskId: string;
    userId: string;
    title: string;
    expiryDate: Date;
    weight?: number;
    metadata?: Record<string, any>;
  }) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
    });
    if (!task) {
      throw new NotFoundException();
    }
    // https://github.com/typeorm/typeorm/issues/2794#issuecomment-1202730034
    if (dayjs(task.expiryDate).isBefore(request.expiryDate)) {
      throw new InvalidExpiryDateSubtaskException(task.expiryDate);
    }
    if (!task.assignee) {
      throw new UnassignedTaskException();
    }
    if (!statusForUpdate.includes(task.status)) {
      throw new InvalidTaskStatusForUpdateException();
    }

    const subTask = new Task();
    Object.assign(subTask, request);
    subTask.projectId = task.projectId;
    subTask.parentId = task.id;
    subTask.parents = [...(task.parents || []), task.id];
    await this.entityManager.getRepository(Task).save(subTask);

    await this.entityManager
      .createQueryBuilder()
      .update(Task)
      .whereInIds([request.taskId])
      .set({
        childrenCount: () => 'childrenCount + 1',
        childrenWeight: () => `childrenWeight + ${subTask.weight}`,
      })
      .execute();

    return { id: subTask.id };
  }
}

@serverModule.useApi(taskApi.createSubtask)
export class CreateSubtaskApiService extends BaseService {
  constructor(
    @inject(CreateSubtaskService)
    protected createSubtaskService: CreateSubtaskService
  ) {
    super();
  }

  handle(
    request: InferApiRequest<typeof taskApi.createSubtask>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    return this.createSubtaskService.handle({
      ...request,
      userId: authUser.id,
    });
  }
}

@serverModule.useApi(taskApi.getSubtasks)
export class GetSubtasksApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.getSubtasks>) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
    });
    if (!task) {
      throw new NotFoundException();
    }

    const page = request.page || 1;
    const pageSize = request.pageSize || 10;
    const totalItems = task.childrenCount;
    let query = this.databaseService.manager
      .createQueryBuilder(Task, 'task')
      .where('task.parentId = :parentId', { parentId: task.id });
    if (request.userId) {
      query = query.andWhere('task.userId = :userId', {
        userId: request.userId,
      });
    }
    if (request.statuses) {
      query = query.andWhere('task.status IN (:...statuses)', {
        statuses: request.statuses,
      });
    }
    if (request.metadataFilters) {
      query = query.andWhere(
        databaseUtils.makeWhere(
          request.metadataFilters,
          (field) => `task.metadata->>'${field}'`
        )
      );
    }
    if (request.orderBy) {
      query = query.orderBy(
        Object.fromEntries(
          request.orderBy.map((item) => [
            `task."${item.attribute}"`,
            item.direction,
          ])
        )
      );
    }
    const items = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      items: items,
      pagination: { page, pageSize, totalItems },
    };
  }
}

@serverModule.injectable()
export class UpdateTaskService extends InjectDatabaseService {
  async handle(request: {
    taskId: string;
    title?: string;
    expiryDate?: Date;
    weight?: number;
    metadata?: Record<string, any>;
  }) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      lock: { mode: 'pessimistic_write' },
      cache: true,
    });
    if (!task) {
      throw new NotFoundException();
    }
    if (!statusForUpdate.includes(task.status)) {
      throw new InvalidTaskStatusForUpdateException();
    }
    if (task.parentId) {
      const parentTask = await this.entityManager.getRepository(Task).findOne({
        where: { id: task.parentId },
        select: ['expiryDate'],
      });
      if (!parentTask) {
        throw new NotFoundException();
      }
      if (dayjs(parentTask.expiryDate).isBefore(request.expiryDate)) {
        throw new InvalidExpiryDateSubtaskException(parentTask.expiryDate);
      }
    }

    await this.entityManager.getRepository(Task).update(
      { id: request.taskId },
      {
        title: request.title,
        weight: request.weight,
        metadata: request.metadata,
        expiryDate: request.expiryDate,
      }
    );

    const deltaWeight = request.weight && request.weight - task.weight;
    if (deltaWeight && task.parentId) {
      await this.entityManager
        .getRepository(Task)
        .increment({ id: task.parentId }, 'childrenWeight', deltaWeight);
    }
    return {};
  }
}

@serverModule.useApi(taskApi.update)
export class UpdateTaskApiService extends BaseService {
  constructor(
    @inject(UpdateTaskService) protected updateTaskService: UpdateTaskService
  ) {
    super();
  }

  handle(request: InferApiRequest<typeof taskApi.update>) {
    return this.updateTaskService.handle(request);
  }
}

@serverModule.useApi(taskApi.getOne)
export class GetTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.getOne>) {
    const result = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
    });
    if (result) {
      return result;
    }
    throw new NotFoundException();
  }
}

@serverModule.useApi(taskApi.delete)
export class DeleteTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.delete>) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
      lock: { mode: 'pessimistic_write' },
    });
    if (!task) {
      throw new NotFoundException();
    }
    if (
      !task.parentId ||
      task.childrenCount ||
      task.status !== constants.TaskStatus.PENDING
    ) {
      throw new DeleteTaskException();
    }

    await this.entityManager.getRepository(Task).delete({ id: task.id });
    await this.entityManager
      .createQueryBuilder()
      .update(Task)
      .whereInIds([task.parentId])
      .set({
        childrenCount: () => 'childrenCount - 1',
        childrenWeight: () => `childrenWeight - ${task.weight}`,
      })
      .execute();
    return {};
  }
}

@serverModule.injectable()
export class AssignTaskService extends InjectDatabaseService {
  async handle(request: { taskId: string; userId: string }) {
    const result = await this.entityManager
      .getRepository(Task)
      .update(
        { id: request.taskId, assignee: IsNull() },
        { assignee: request.userId }
      );
    if (!result.affected) {
      throw new AlreadyAssignedTaskException();
    }
    return {};
  }
}

@serverModule.useApi(taskApi.assign)
export class AssignTaskApiService extends BaseService {
  constructor(
    @inject(DatabaseService) private databaseService: DatabaseService,
    @inject(AssignTaskService) private assignTaskService: AssignTaskService,
    @inject(CheckRoleUsersApiService)
    private checkRoleUsersApiService: CheckRoleUsersApiService
  ) {
    super();
  }

  async handle(request: InferApiRequest<typeof taskApi.assign>) {
    const task = await this.databaseService.manager
      .getRepository(Task)
      .findOne({ where: { id: request.taskId }, cache: true });
    if (!task) {
      throw new NotFoundException();
    }
    const resultCheck = await this.checkRoleUsersApiService.handle({
      scopeId: task.projectId,
      scope: scopes.Project.name,
      userIds: [request.userId],
    });
    if (!resultCheck.success) {
      throw new UserNotInProjectException();
    }
    return this.assignTaskService.handle(request);
  }
}

@serverModule.useApi(taskApi.assignMe)
export class AssignMeTaskApiService extends BaseService {
  constructor(
    @inject(AssignTaskApiService)
    private assignTaskApiService: AssignTaskApiService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof taskApi.assignMe>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    return this.assignTaskApiService.handle({
      taskId: request.taskId,
      userId: authUser.id,
    });
  }
}

@serverModule.useApi(taskApi.inprogress)
export class InprogressTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.inprogress>) {
    const result = await this.entityManager
      .getRepository(Task)
      .update(
        { id: request.taskId, status: constants.TaskStatus.PENDING },
        { status: constants.TaskStatus.INPROGRESS, startedDate: new Date() }
      );
    if (result.affected) {
      return {};
    }
    throw new InprogressTaskException();
  }
}

@serverModule.useApi(taskApi.reject)
export class RejectTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.reject>) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
      lock: { mode: 'pessimistic_write' },
    });
    if (!task) {
      throw new NotFoundException();
    }
    const result = await this.entityManager.getRepository(Task).update(
      {
        id: request.taskId,
        status: In([
          constants.TaskStatus.PENDING,
          constants.TaskStatus.INPROGRESS,
        ]),
        childrenCount: 0,
      },
      {
        status: constants.TaskStatus.REJECTED,
        rejectedDate: new Date(),
        weight: 0,
      }
    );
    if (result.affected) {
      if (task.parentId) {
        await this.entityManager
          .getRepository(Task)
          .decrement({ id: task.parentId }, 'childrenWeight', task.weight);
      }
      return {};
    }
    throw new RejectTaskException();
  }
}

@serverModule.useApi(taskApi.cancel)
export class CancelTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.cancel>) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
      lock: { mode: 'pessimistic_write' },
    });
    if (!task) {
      throw new NotFoundException();
    }
    const result = await this.entityManager.getRepository(Task).update(
      {
        id: request.taskId,
        status: constants.TaskStatus.PENDING,
        childrenCount: 0,
      },
      {
        status: constants.TaskStatus.CANCELED,
        canceledDate: new Date(),
        weight: 0,
      }
    );
    if (result.affected) {
      if (task.parentId) {
        await this.entityManager
          .getRepository(Task)
          .decrement({ id: task.parentId }, 'childrenWeight', task.weight);
      }
      return {};
    }
    throw new RejectTaskException();
  }
}

@serverModule.useApi(taskApi.finish)
export class FinishTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.finish>) {
    const task = await this.entityManager.getRepository(Task).findOne({
      where: { id: request.taskId },
      cache: true,
      lock: { mode: 'pessimistic_write' },
    });
    if (!task) {
      throw new NotFoundException();
    }
    const finishUpdate = {
      status: constants.TaskStatus.FINISHED,
      finishedDate: new Date(),
    };
    if (task.childrenCount) {
      const result = await this.entityManager
        .getRepository(Task)
        .update(
          { id: request.taskId, progress: task.childrenWeight },
          finishUpdate
        );
      if (!result.affected) {
        throw new FinishParenttaskException();
      }
    } else {
      const result = await this.entityManager.getRepository(Task).update(
        {
          id: request.taskId,
          status: In([
            constants.TaskStatus.PENDING,
            constants.TaskStatus.INPROGRESS,
          ]),
          childrenCount: 0,
        },
        finishUpdate
      );
      if (!result.affected) {
        throw new FinishSubtaskException();
      }
    }
    if (task.parentId) {
      await this.entityManager
        .getRepository(Task)
        .increment({ id: task.parentId }, 'progress', task.weight);
    }
    return {};
  }
}
