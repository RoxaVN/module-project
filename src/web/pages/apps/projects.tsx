import { ModuleT } from '@roxavn/core/web';
import { IconInbox, IconUser } from '@tabler/icons-react';

import { webModule } from '../../module.js';

export default webModule.makeAppPages([
  {
    label: <ModuleT module={webModule} k="projects" />,
    path: '',
    icon: IconInbox,
  },
  {
    label: <ModuleT module={webModule} k="myProjects" />,
    path: 'me',
    icon: IconUser,
  },
]);
