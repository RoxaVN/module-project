import {
  Badge,
  Card,
  Group,
  NumberInput,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Api } from '@roxavn/core/base';
import {
  ApiConfirmFormGroup,
  ApiFormGroup,
  userService,
  utils,
  webModule as coreWebModule,
  PermissionButton,
} from '@roxavn/core/web';
import {
  IconBan,
  IconCheck,
  IconEdit,
  IconHammer,
  IconTrash,
  IconUser,
  IconUserSearch,
} from '@tabler/icons-react';

import {
  TaskResponse,
  constants,
  webRoutes,
  taskApi,
  scopes,
} from '../../base/index.js';
import { webModule } from '../module.js';

export interface TaskInfoProps {
  task: TaskResponse;
}

export function mapColor(status: string) {
  switch (status) {
    case constants.TaskStatus.FINISHED:
      return 'green';
    case constants.TaskStatus.REJECTED:
      return 'red';
    case constants.TaskStatus.PENDING:
      return 'gray';
  }
  return undefined;
}

export function TaskInfo({ task }: TaskInfoProps) {
  const { t } = webModule.useTranslation();
  const tCore = coreWebModule.useTranslation().t;
  const renderUser = userService.reference.use(
    { ids: [task.userId, task.assignee] },
    { cache: true }
  ).renderItem;

  const renderAction = (
    status: string,
    api: Api,
    icon: React.ComponentType<any>
  ) => (
    <PermissionButton
      label={t(status)}
      key={status}
      icon={icon}
      color={mapColor(status)}
      variant="subtle"
      modal={({ navigate, closeModal }) => ({
        title: t(status + 'Task'),
        children: (
          <ApiConfirmFormGroup
            api={api}
            apiParams={{ taskId: task.id }}
            onCancel={closeModal}
            onSuccess={() => navigate()}
          />
        ),
      })}
    />
  );
  const renderActions = () => {
    const result = [];
    if (task.status === constants.TaskStatus.PENDING) {
      result.push(
        renderAction(
          constants.TaskStatus.INPROGRESS,
          taskApi.inprogress,
          IconHammer
        )
      );
    } else if (task.status === constants.TaskStatus.INPROGRESS) {
      result.push(
        renderAction(constants.TaskStatus.FINISHED, taskApi.finish, IconCheck)
      );
    }
    if (result.length && task.childrenCount < 1) {
      // only reject subtask
      result.push(
        renderAction(constants.TaskStatus.REJECTED, taskApi.reject, IconBan)
      );
    }
    return result;
  };

  return (
    <Card shadow="md" padding="md" radius="md" mb="md" withBorder>
      <Group position="apart" mb="xs">
        <Text weight={500}>{task.title}</Text>
        <Group spacing="md">
          <PermissionButton
            label={tCore('edit')}
            variant="outline"
            icon={IconEdit}
            modal={({ navigate }) => ({
              title: t('editTask'),
              children: (
                <ApiFormGroup
                  api={taskApi.update}
                  apiParams={{
                    taskId: task.id,
                    title: task.title,
                    weight: task.weight,
                    expiryDate: task.expiryDate,
                  }}
                  fields={[
                    {
                      name: 'title',
                      input: <TextInput label={tCore('title')} />,
                    },
                    {
                      name: 'expiryDate',
                      input: (
                        <DatePickerInput
                          label={tCore('expiryDate')}
                          popoverProps={{ withinPortal: true }}
                        />
                      ),
                    },
                    {
                      name: 'weight',
                      input: <NumberInput label={t('taskWeight')} />,
                    },
                  ]}
                  onSuccess={() => navigate()}
                />
              ),
            })}
          />
          <PermissionButton
            label={tCore('delete')}
            icon={IconTrash}
            variant="outline"
            color="red"
            modal={({ closeModal, navigate }) => ({
              title: t('deleteTask'),
              children: (
                <ApiConfirmFormGroup
                  api={taskApi.delete}
                  apiParams={{ taskId: task.id }}
                  onCancel={closeModal}
                  onSuccess={() =>
                    navigate(
                      task.parentId &&
                        webRoutes.Task.generate({ taskId: task.parentId })
                    )
                  }
                />
              ),
            })}
          />
        </Group>
      </Group>
      <Table>
        <tbody>
          <tr>
            <th>{tCore('status')}</th>
            <td>
              <Group spacing="md">
                <Badge color={mapColor(task.status)} variant="light">
                  {t(task.status)}
                </Badge>
                {renderActions()}
              </Group>
            </td>
          </tr>
          <tr>
            <th>{tCore('creator')}</th>
            <td>{renderUser(task.userId)}</td>
          </tr>
          <tr>
            <th>{t('assignee')}</th>
            <td>
              {task.assignee ? (
                renderUser(task.assignee)
              ) : (
                <Group spacing="md">
                  <PermissionButton
                    label={t('assignMe')}
                    icon={IconUser}
                    variant="subtle"
                    modal={({ closeModal, navigate }) => ({
                      title: t('assignMe'),
                      children: (
                        <ApiConfirmFormGroup
                          api={taskApi.assignMe}
                          apiParams={{ taskId: task.id }}
                          onCancel={closeModal}
                          onSuccess={() => navigate()}
                        />
                      ),
                    })}
                  />
                  <PermissionButton
                    label={t('assign')}
                    icon={IconUserSearch}
                    variant="subtle"
                    modal={({ navigate }) => ({
                      title: t('assign'),
                      children: (
                        <ApiFormGroup
                          api={taskApi.assign}
                          apiParams={{ taskId: task.id }}
                          fields={[
                            {
                              name: 'userId',
                              input: (
                                <userService.roleUserInput
                                  scope={scopes.Project.name}
                                  scopeId={task.projectId}
                                  label={t('assignee')}
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
              )}
            </td>
          </tr>
          <tr>
            <th>{t('progress')}</th>
            <td>
              {task.childrenWeight &&
                utils.Render.percent(task.progress / task.childrenWeight)}
            </td>
          </tr>
          <tr>
            <th>{t('taskWeight')}</th>
            <td>{task.weight}</td>
          </tr>
          <tr>
            <th>{tCore('createdDate')}</th>
            <td>{utils.Render.date(task.createdDate)}</td>
          </tr>
          <tr>
            <th>{tCore('expiryDate')}</th>
            <td>{utils.Render.date(task.expiryDate)}</td>
          </tr>
          {task.startedDate && (
            <tr>
              <th>{t('startedDate')}</th>
              <td>{utils.Render.datetime(task.startedDate)}</td>
            </tr>
          )}
          {task.finishedDate && (
            <tr>
              <th>{t('finishedDate')}</th>
              <td>{utils.Render.datetime(task.finishedDate)}</td>
            </tr>
          )}
          {task.rejectedDate && (
            <tr>
              <th>{t('rejectedDate')}</th>
              <td>{utils.Render.datetime(task.rejectedDate)}</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
