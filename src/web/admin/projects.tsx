import { Select, TextInput } from '@mantine/core';
import {
  ApiTable,
  IfCanAccessApi,
  webModule as coreWebModule,
  utils,
  ApiFormGroup,
  ApiConfirmFormGroup,
  PageItem,
  userService,
  ModuleT,
} from '@roxavn/core/web';
import {
  IconEdit,
  IconInbox,
  IconPlus,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';

import { constants, projectApi, scopes } from '../../base/index.js';
import { webModule } from '../module.js';

const Page = () => {
  const { t } = webModule.useTranslation();
  const tCore = coreWebModule.useTranslation().t;
  return (
    <ApiTable
      api={projectApi.getMany}
      header={t('projects')}
      headerActions={[
        {
          label: tCore('add'),
          icon: IconPlus,
          modal: {
            title: t('addProject'),
            children: (
              <ApiFormGroup
                api={projectApi.create}
                fields={[
                  { name: 'name', input: <TextInput label={tCore('name')} /> },
                  {
                    name: 'type',
                    input: (
                      <Select
                        label={tCore('type')}
                        data={Object.values(constants.ProjectTypes)}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        },
      ]}
      columns={{
        userId: { label: tCore('creator'), reference: userService.reference },
        name: { label: tCore('name') },
        type: { label: tCore('type') },
        createdDate: {
          label: tCore('createdDate'),
          render: utils.Render.relativeTime,
        },
      }}
      cellActions={(item) => [
        {
          label: tCore('edit'),
          icon: IconEdit,
          modal: {
            title: t('editProject'),
            children: (
              <ApiFormGroup
                api={projectApi.update}
                apiParams={{
                  projectId: item.id,
                  name: item.name,
                  type: item.type,
                }}
                fields={[
                  { name: 'name', input: <TextInput label={tCore('name')} /> },
                  {
                    name: 'type',
                    input: (
                      <Select
                        label={tCore('type')}
                        data={Object.values(constants.ProjectTypes)}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        },
        {
          label: tCore('delete'),
          icon: IconTrash,
          modal: ({ closeModal }) => ({
            title: t('deleteProject'),
            children: (
              <ApiConfirmFormGroup
                api={projectApi.delete}
                apiParams={{ projectId: item.id }}
                onCancel={closeModal}
              />
            ),
          }),
        },
        {
          label: tCore('members'),
          icon: IconUsers,
          access: {
            api: userService.roleUsersAccessApi,
            apiParams: { module: webModule.name },
          },
          drawer: {
            title: tCore('members'),
            children: (
              <userService.roleUsers
                scopeId={item.id}
                module={webModule.name}
                scope={scopes.Project.name}
              />
            ),
          },
        },
      ]}
    />
  );
};

export const projectsPage = new PageItem({
  label: <ModuleT module={webModule} k="projects" />,
  path: 'projects',
  icon: IconInbox,
  element: (
    <IfCanAccessApi api={projectApi.getMany}>
      <Page />
    </IfCanAccessApi>
  ),
});
