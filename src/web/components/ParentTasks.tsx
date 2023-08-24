import { Card, List } from '@mantine/core';
import { InferApiResponse } from '@roxavn/core/base';
import { Fragment } from 'react';

import { projectTaskApi } from '../../base/index.js';
import { TaskPreview } from './TaskPreview.js';

export interface ParentTasksProps {
  parentTasks: InferApiResponse<typeof projectTaskApi.getSome>;
}

export function ParentTasks({ parentTasks }: ParentTasksProps) {
  let element: JSX.Element | undefined;
  for (let i = parentTasks.items.length - 1; i >= 0; --i) {
    const task = parentTasks.items[i];
    element = (
      <List withPadding={i > 0} listStyleType="none">
        <List.Item>
          <TaskPreview task={task} />
        </List.Item>
        {element && <List.Item>{element}</List.Item>}
      </List>
    );
  }
  return element ? (
    <Card shadow="md" padding="md" radius="md" mb="md" withBorder>
      {element}
    </Card>
  ) : (
    <Fragment />
  );
}
