import {
  ApiSource,
  ArrayMaxSize,
  ArrayMinSize,
  ExactProps,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  MaxLength,
  Min,
  MinLength,
  PaginationRequest,
} from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

export interface ProjectResponse {
  id: string;
  type: string;
  isPublic: boolean;
  name: string;
  userId: string;
  createdDate: Date;
  updatedDate: Date;
}

const projectSource = new ApiSource<ProjectResponse>(
  [scopes.Project],
  baseModule
);

class GetProjectRequest extends ExactProps<GetProjectRequest> {
  @MinLength(1)
  public readonly projectId!: string;
}

class GetProjectsRequest extends PaginationRequest<GetProjectsRequest> {
  @IsOptional()
  public readonly type?: string;

  @IsBoolean()
  @IsOptional()
  public readonly isPublic?: boolean;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsDateString({}, { each: true })
  @IsOptional()
  public readonly createdDate?: Date[];
}

class GetJoinedProjectsRequest extends PaginationRequest<GetJoinedProjectsRequest> {
  @MinLength(1)
  public readonly userId!: string;
}

class CreateProjectRequest extends ExactProps<CreateProjectRequest> {
  @MinLength(1)
  @MaxLength(1024)
  public readonly name!: string;

  @IsBoolean()
  public readonly isPublic!: boolean;

  @Min(1)
  public readonly duration!: number;
}

class UpdateProjectRequest extends ExactProps<UpdateProjectRequest> {
  @MinLength(1)
  public readonly projectId!: string;

  @MaxLength(1024)
  @MinLength(1)
  @IsOptional()
  public readonly name?: string;

  @IsBoolean()
  @IsOptional()
  public readonly isPublic?: boolean;
}

class DeleteProjectRequest extends ExactProps<DeleteProjectRequest> {
  @MinLength(1)
  public readonly projectId!: string;
}

export const projectApi = {
  getOne: projectSource.getOne({
    validator: GetProjectRequest,
    permission: permissions.ReadProject,
  }),
  getMany: projectSource.getMany({
    validator: GetProjectsRequest,
    permission: permissions.ReadProjects,
  }),
  getManyJoined: projectSource.getMany({
    path: baseModule.apiPath('/joined-projects'),
    validator: GetJoinedProjectsRequest,
    permission: permissions.ReadProjects,
  }),
  create: projectSource.create({
    validator: CreateProjectRequest,
    permission: permissions.CreateProject,
  }),
  update: projectSource.update({
    validator: UpdateProjectRequest,
    permission: permissions.UpdateProject,
  }),
  delete: projectSource.delete({
    validator: DeleteProjectRequest,
    permission: permissions.DeleteProject,
  }),
};
