import { Anchor, NumberInput, Select, TextInput } from '@mantine/core';
import { Link } from '@remix-run/react';
import {
  ApiFormGroup,
  ApiTable,
  authService,
  IsAuthenticatedPage,
  utils,
  webModule as coreWebModule,
} from '@roxavn/core/web';
import { IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { constants, projectApi, webRoutes } from '../../../../base/index.js';
import { webModule } from '../../../module.js';

function MePage() {
  const { t } = webModule.useTranslation();
  const tCore = coreWebModule.useTranslation().t;
  const [userId, setuserid] = useState<string>();

  useEffect(() => {
    const tokenData = authService.getTokenData();
    if (tokenData) {
      setuserid(tokenData.userId);
    }
  }, []);

  return userId ? (
    <ApiTable
      api={projectApi.getManyJoined}
      apiParams={{ userId }}
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
                        withinPortal
                        label={tCore('type')}
                        data={Object.values(constants.ProjectTypes)}
                      />
                    ),
                  },
                  {
                    name: 'duration',
                    input: <NumberInput label={t('projectDuration')} />,
                  },
                ]}
              />
            ),
          },
        },
      ]}
      columns={{
        name: {
          label: tCore('name'),
          render: (name, item) => (
            <Anchor
              component={Link}
              to={webRoutes.Project.generate({ projectId: item.id })}
            >
              {name}
            </Anchor>
          ),
        },
        type: { label: tCore('type') },
        createdDate: {
          label: tCore('createdDate'),
          render: utils.Render.relativeTime,
        },
      }}
    />
  ) : (
    <div />
  );
}

export default function () {
  return (
    <IsAuthenticatedPage>
      <MePage />
    </IsAuthenticatedPage>
  );
}
