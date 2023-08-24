import { type InferApiRequest, NotFoundException } from '@roxavn/core/base';
import {
  AuthUser,
  BaseService,
  CheckRoleUsersApiService,
  DatabaseService,
  type InferContext,
  inject,
  InjectDatabaseService,
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

@serverModule.useApi(taskApi.createSubtask)
export class CreateSubtaskApiService extends InjectDatabaseService {
  async handle(
    request: InferApiRequest<typeof taskApi.createSubtask>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
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
    subTask.userId = authUser.id;
    subTask.title = request.title;
    subTask.expiryDate = request.expiryDate;
    subTask.projectId = task.projectId;
    subTask.parentId = task.id;
    subTask.weight = request.weight;
    subTask.parents = [...(task.parents || []), task.id];
    await this.entityManager.save(subTask);

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
    const pageSize = 10;
    const totalItems = task.childrenCount;
    const items = await this.entityManager.getRepository(Task).find({
      where: { parentId: task.id },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return {
      items: items,
      pagination: { page, pageSize, totalItems },
    };
  }
}

@serverModule.useApi(taskApi.update)
export class UpdateTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof taskApi.update>) {
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
        expiryDate: request.expiryDate,
      }
    );

    const deltaWeight = request.weight - task.weight;
    if (deltaWeight && task.parentId) {
      await this.entityManager
        .getRepository(Task)
        .increment({ id: task.parentId }, 'childrenWeight', deltaWeight);
    }
    return {};
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

@serverModule.useApi(taskApi.assign)
export class AssignTaskApiService extends BaseService {
  constructor(
    @inject(DatabaseService) private databaseService: DatabaseService,
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
    const result = await this.databaseService.manager
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
          status: constants.TaskStatus.INPROGRESS,
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
