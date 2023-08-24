import { Anchor, Badge, Group, Text } from '@mantine/core';
import { Link } from '@remix-run/react';
import { utils } from '@roxavn/core/web';

import { TaskResponse, webRoutes } from '../../base/index.js';
import { webModule } from '../module.js';
import { mapColor } from './Task.js';

export interface TaskPreviewProps {
  task: TaskResponse;
}

export function TaskPreview({ task }: TaskPreviewProps) {
  const { t } = webModule.useTranslation();

  const renderStatus = () => {
    if (task.childrenCount) {
      const percent = task.progress / task.childrenWeight;
      return (
        <Badge color={mapColor(task.status)} variant="light">
          {utils.Render.percent(percent || 0)}
        </Badge>
      );
    }
    return (
      <Badge color={mapColor(task.status)} variant="light">
        {t(task.status)}
      </Badge>
    );
  };

  return (
    <Group position="apart">
      <Anchor
        component={Link}
        to={webRoutes.Task.generate({ taskId: task.id })}
      >
        <Text weight={500}>{task.title}</Text>
      </Anchor>
      {renderStatus()}
    </Group>
  );
}
