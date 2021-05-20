import React from 'react';
import { randomString } from '@togglecorp/fujs';

import AlertContext, {
  AlertVariant,
  DEFAULT_ALERT_DISMISS_DURATION,
} from '#components/AlertContext';

interface AddAlertOption {
  name?: string;
  variant?: AlertVariant;
  duration?: number;
  nonDismissable?: boolean;
}

function useAlertContext() {
  const {
    addAlert,
    // removeAlert,
    // updateAlert,
  } = React.useContext(AlertContext);

  const show = React.useCallback((children: React.ReactNode, options?: AddAlertOption) => {
    const name = options?.name ?? randomString(16);
    addAlert({
      variant: options?.variant ?? 'default',
      duration: options?.duration ?? DEFAULT_ALERT_DISMISS_DURATION,
      name,
      children,
      nonDismissable: options?.nonDismissable ?? false,
    });
  }, [addAlert]);

  return React.useMemo(() => ({
    show,
  }), [show]);
}

export default useAlertContext;
