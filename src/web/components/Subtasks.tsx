import { Card, Group, NumberInput, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { InferApiResponse } from '@roxavn/core/base';
import {
  ApiFormGroup,
  PaginationLinks,
  PermissionButton,
  webModule as coreWebModule,
} from '@roxavn/core/web';
import { IconPlus } from '@tabler/icons-react';

import { TaskResponse, taskApi } from '../../base/index.js';
import { webModule } from '../module.js';
import { TaskPreview } from './TaskPreview.js';

export interface SubtasksProps {
  task: TaskResponse;
  subtasks: InferApiResponse<typeof taskApi.getSubtasks>;
}

export function Subtasks({ subtasks, task }: SubtasksProps) {
  const { t } = webModule.useTranslation();
  const tCore = coreWebModule.useTranslation().t;

  return (
    <Card shadow="md" padding="md" radius="md" mb="md" withBorder>
      <Group position="apart" mb="xs">
        <Text weight={500}>{t('subtasks')}</Text>
        <PermissionButton
          label={tCore('add')}
          icon={IconPlus}
          modal={({ navigate }) => ({
            title: t('addSubtask'),
            children: (
              <ApiFormGroup
                api={taskApi.createSubtask}
                apiParams={{ taskId: task.id, weight: 10 }}
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
                        maxDate={task.expiryDate}
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
      </Group>
      <div>
        {subtasks.items.map((item) => (
          <TaskPreview key={item.id} task={item} />
        ))}
      </div>
      <PaginationLinks
        my="md"
        data={subtasks.pagination}
        locationKey="subtasks"
      />
    </Card>
  );
}
