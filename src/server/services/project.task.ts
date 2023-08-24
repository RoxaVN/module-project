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

@serverModule.useApi(projectTaskApi.getSome)
export class GetProjectTasksApiService extends InjectDatabaseService {
  async handle(request: InferApiRequest<typeof projectTaskApi.getSome>) {
    if (request.ids?.length > 0) {
      const items = await this.entityManager.getRepository(Task).find({
        where: {
          projectId: request.projectId,
          id: In(request.ids),
        },
        order: { id: 'ASC' },
      });
      return { items };
    }
    return { items: [] };
  }
}
