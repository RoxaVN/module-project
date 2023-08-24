import { Anchor, Card, Text } from '@mantine/core';
import { LoaderArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { servicesLoader } from '@roxavn/core/server';
import { PaginationLinks, useLoaderData, utils } from '@roxavn/core/web';

import { constants } from '../../../../base/index.js';
import { GetProjectsApiService } from '../../../../server/index.js';

export default function () {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      {data.projects.items.map((item) => (
        <Card key={item.id}>
          <Anchor component={Link} to={item.id}>
            <Text weight="500">{item.name}</Text>
          </Anchor>
          <Text size="sm" color="dimmed">
            {utils.Render.relativeTime(item.updatedDate)}
          </Text>
        </Card>
      ))}
      <PaginationLinks
        my="md"
        data={data.projects.pagination}
        locationKey="projects"
      />
    </div>
  );
}

export function loader(args: LoaderArgs) {
  return servicesLoader.load(args, {
    projects: {
      service: GetProjectsApiService,
      params: { type: constants.ProjectTypes.PUBLIC },
    },
  });
}
