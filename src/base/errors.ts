import { BadRequestException, I18nErrorField } from '@roxavn/core/base';
import { baseModule } from './module.js';

export class InvalidExpiryDateSubtaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.InvalidExpiryDateSubtaskException',
      ns: baseModule.escapedName,
    } as I18nErrorField,
  };

  constructor(maxExpiryDate: Date) {
    super();
    this.i18n.default.params = { maxExpiryDate };
  }
}

export class UnassignedTaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.UnassignedTaskException',
      ns: baseModule.escapedName,
    },
  };
}

export class InvalidTaskStatusForUpdateException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.InvalidTaskStatusForUpdateException',
      ns: baseModule.escapedName,
    },
  };
}

export class AlreadyAssignedTaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.AlreadyAssignedTaskException',
      ns: baseModule.escapedName,
    },
  };
}

export class UserNotInProjectException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.UserNotInProjectException',
      ns: baseModule.escapedName,
    },
  };
}

export class DeleteTaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.DeleteTaskException',
      ns: baseModule.escapedName,
    },
  };
}

export class InprogressTaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.InprogressTaskException',
      ns: baseModule.escapedName,
    },
  };
}

export class RejectTaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.RejectTaskException',
      ns: baseModule.escapedName,
    },
  };
}

export class FinishSubtaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.FinishSubtaskException',
      ns: baseModule.escapedName,
    },
  };
}
export class FinishParenttaskException extends BadRequestException {
  i18n = {
    default: {
      key: 'Error.FinishParenttaskException',
      ns: baseModule.escapedName,
    },
  };
}
