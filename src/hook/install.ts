import { BaseInstallHook } from '@roxavn/core/server';

import { roles } from '../base/index.js';
import { serverModule } from '../server/index.js';

@serverModule.injectable()
export class InstallHook extends BaseInstallHook {
  async handle() {
    await this.createRoleService.handle(roles);
    await this.setAdminRoleService.handle(roles.Admin);
  }
}
