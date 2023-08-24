import { Card, Tabs } from '@mantine/core';
import { LoaderArgs } from '@remix-run/node';
import { servicesLoader } from '@roxavn/core/server';
import {
  useLoaderData,
  webModule as coreWebModule,
  userService,
  ApiRolesGetter,
} from '@roxavn/core/web';
import { IconSubtask, IconUsers } from '@tabler/icons-react';

import {
  GetProjectApiService,
  GetProjectRootTaskApiService,
} from '../../../../server/index.js';
import { ProjectInfo, TaskPreview } from '../../../components/index.js';
import { webModule } from '../../../module.js';
import { scopes } from '../../../../base/index.js';

export default function () {
  const data = useLoaderData<typeof loader>();
  const { t } = webModule.useTranslation();
  const tCore = coreWebModule.useTranslation().t;
  const params = scopes.Project.makeScopeParams(data.project.id);

  return (
    <div>
      <ApiRolesGetter apiParams={params} />
      <ProjectInfo project={data.project} />
      <Tabs defaultValue="tasks" mb="md" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="tasks" icon={<IconSubtask size="0.8rem" />}>
            {t('tasks')}
          </Tabs.Tab>
          <userService.roleUsersGuard {...params}>
            <Tabs.Tab value="members" icon={<IconUsers size="0.8rem" />}>
              {tCore('members')}
            </Tabs.Tab>
          </userService.roleUsersGuard>
        </Tabs.List>

        <Tabs.Panel value="tasks">
          <Card shadow="md" padding="md" radius="md" withBorder>
            <TaskPreview task={data.task} />
          </Card>
        </Tabs.Panel>
        <Tabs.Panel value="members">
          <userService.roleUsers {...params} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export function loader(args: LoaderArgs) {
  return servicesLoader.load(args, {
    project: {
      service: GetProjectApiService,
      checkPermission: true,
    },
    task: {
      service: GetProjectRootTaskApiService,
    },
  });
}
