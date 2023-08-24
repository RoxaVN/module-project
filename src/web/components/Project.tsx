import {
  Anchor,
  Badge,
  Card,
  Group,
  Select,
  Text,
  TextInput,
} from '@mantine/core';
import { Link } from '@remix-run/react';
import {
  ApiFormGroup,
  utils,
  webModule as coreWebModule,
  PermissionButton,
} from '@roxavn/core/web';
import { IconEdit } from '@tabler/icons-react';

import {
  constants,
  projectApi,
  ProjectResponse,
  webRoutes,
} from '../../base/index.js';

export interface ProjectInfoProps {
  project: ProjectResponse;
}

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  const tCore = coreWebModule.useTranslation().t;

  return (
    <Card shadow="md" padding="md" radius="md" mb="md" withBorder>
      <Group position="apart" mb="xs">
        <Anchor
          component={Link}
          to={webRoutes.Project.generate({ projectId: project.id })}
        >
          <Text weight={500}>{project.name}</Text>
        </Anchor>
        <Badge
          color={
            project.type === constants.ProjectTypes.PUBLIC ? 'green' : 'orange'
          }
          variant="light"
        >
          {tCore(project.type)}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed">
        {utils.Render.relativeTime(project.createdDate)}
      </Text>

      <Group position="right">
        <PermissionButton
          label={tCore('edit')}
          icon={IconEdit}
          modal={({ navigate }) => ({
            title: tCore('edit'),
            children: (
              <ApiFormGroup
                api={projectApi.update}
                apiParams={{
                  projectId: project.id,
                  name: project.name,
                  type: project.type,
                }}
                fields={[
                  { name: 'name', input: <TextInput label={tCore('name')} /> },
                  {
                    name: 'type',
                    input: (
                      <Select
                        withinPortal
                        label={tCore('type')}
                        data={Object.values(constants.ProjectTypes)}
                      />
                    ),
                  },
                ]}
                onSuccess={() => navigate()}
              />
            ),
          })}
        />
      </Group>
    </Card>
  );
};
