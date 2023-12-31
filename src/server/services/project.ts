import { type InferApiRequest, NotFoundException } from '@roxavn/core/base';
import {
  AuthUser,
  BaseService,
  DatabaseService,
  type InferContext,
  InjectDatabaseService,
  SetUserRoleApiService,
  inject,
  GetUserScopeIdsApiService,
} from '@roxavn/core/server';
import dayjs from 'dayjs';
import { In } from 'typeorm';

import { projectApi, roles, scopes } from '../../base/index.js';
import { Project, Task } from '../entities/index.js';
import { serverModule } from '../module.js';

@serverModule.useApi(projectApi.getOne)
export class GetProjectApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectApi.getOne>) {
    const result = await this.entityManager.getRepository(Project).findOne({
      where: { id: request.projectId },
      cache: true,
    });
    if (result) {
      return result;
    }
    throw new NotFoundException();
  }
}

@serverModule.useApi(projectApi.getMany)
export class GetProjectsApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectApi.getMany>) {
    const page = request.page || 1;
    const pageSize = request.pageSize || 10;

    const [items, totalItems] = await this.entityManager
      .getRepository(Project)
      .findAndCount({
        where: { type: request.type, isPublic: request.isPublic },
        take: pageSize,
        skip: (page - 1) * pageSize,
      });

    return {
      items: items,
      pagination: { page, pageSize, totalItems },
    };
  }
}

@serverModule.useApi(projectApi.getManyJoined)
export class GetJoinedProjectsApiService extends BaseService {
  constructor(
    @inject(DatabaseService) private databaseService: DatabaseService,
    @inject(GetUserScopeIdsApiService)
    private getUserScopeIdsApiService: GetUserScopeIdsApiService
  ) {
    super();
  }

  async handle(request: InferApiRequest<typeof projectApi.getManyJoined>) {
    const page = request.page || 1;
    const pageSize = request.pageSize || 10;

    const result = await this.getUserScopeIdsApiService.handle({
      scope: scopes.Project.name,
      userId: request.userId,
      pageSize,
      page,
    });

    const items = result.items.length
      ? await this.databaseService.manager
          .getRepository(Project)
          .find({ where: { id: In(result.items.map((item) => item.scopeId)) } })
      : [];

    return {
      items: items,
      pagination: result.pagination,
    };
  }
}

@serverModule.injectable()
export class CreateProjectService extends BaseService {
  constructor(
    @inject(DatabaseService) private databaseService: DatabaseService,
    @inject(SetUserRoleApiService)
    private setUserRoleApiService: SetUserRoleApiService
  ) {
    super();
  }

  /**
   *
   * @param request - { duration: Number of days }
   * @returns
   */
  async handle(request: {
    name: string;
    isPublic: boolean;
    duration: number;
    userId: string;
    type?: string;
    metadata?: Record<string, any>;
  }) {
    const project = new Project();
    project.name = request.name;
    project.isPublic = request.isPublic;
    project.userId = request.userId;
    project.metadata = request.metadata;
    if (request.type) {
      project.type = request.type;
    }
    await this.databaseService.manager.getRepository(Project).save(project);

    // auto set creator as admin
    await this.setUserRoleApiService.handle({
      scope: scopes.Project.name,
      scopeId: project.id,
      roleName: roles.ProjectAdmin.name,
      userId: project.userId,
    });

    const task = new Task();
    task.projectId = project.id;
    task.userId = request.userId;
    task.title = request.name;
    task.expiryDate = dayjs().add(request.duration, 'day').toDate();
    await this.databaseService.manager.getRepository(Task).save(task);

    return { id: project.id };
  }
}

@serverModule.useApi(projectApi.create)
export class CreateProjectApiService extends BaseService {
  constructor(
    @inject(CreateProjectService)
    private createProjectService: CreateProjectService
  ) {
    super();
  }

  handle(
    request: InferApiRequest<typeof projectApi.create>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    return this.createProjectService.handle({
      ...request,
      userId: authUser.id,
    });
  }
}

@serverModule.useApi(projectApi.update)
export class UpdateProjectApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectApi.update>) {
    await this.entityManager
      .getRepository(Project)
      .update(
        { id: request.projectId },
        { name: request.name, isPublic: request.isPublic }
      );
    return {};
  }
}

@serverModule.useApi(projectApi.delete)
export class DeleteProjectApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectApi.delete>) {
    await this.entityManager.getRepository(Project).delete({
      id: request.projectId,
    });
    return {};
  }
}
