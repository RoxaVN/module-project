import { InferApiRequest, NotFoundException } from '@roxavn/core/base';
import { InjectDatabaseService } from '@roxavn/core/server';
import { In, IsNull } from 'typeorm';

import { projectTaskApi } from '../../base/index.js';
import { Task } from '../entities/index.js';
import { serverModule } from '../module.js';

@serverModule.useApi(projectTaskApi.getRoot)
export class GetProjectRootTaskApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectTaskApi.getRoot>) {
    const result = await this.entityManager.getRepository(Task).findOne({
      where: {
        projectId: request.projectId,
        parents: IsNull(),
      },
    });
    if (result) {
      return result;
    }
    throw new NotFoundException();
  }
}

@serverModule.useApi(projectTaskApi.getMany)
export class GetProjectTasksApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectTaskApi.getMany>) {
    const page = request.page || 1;
    const pageSize = 10;

    const [items, totalItems] = await this.entityManager
      .getRepository(Task)
      .findAndCount({
        where: {
          projectId: request.projectId,
          id: request.ids && In(request.ids),
          userId: request.userId,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: { id: 'ASC' },
      });

    return {
      items: items,
      pagination: { page, pageSize, totalItems },
    };
  }
}
