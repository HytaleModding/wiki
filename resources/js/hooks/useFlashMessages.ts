import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { sileo } from 'sileo';

interface FlashMessages {
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
}

interface PageProps {
  flash?: FlashMessages;
  [key: string]: unknown;
}

export function useFlashMessages() {
  const { props } = usePage<PageProps>();

  useEffect(() => {
    const flash = props.flash;

    if (flash?.success) {
      sileo.success({
        title: 'Success',
        description: flash.success,
      });
    }

    if (flash?.error) {
      sileo.error({
        title: 'Error',
        description: flash.error,
      });
    }

    if (flash?.info) {
      sileo.show({
        title: 'Info',
        description: flash.info,
      });
    }

    if (flash?.warning) {
      sileo.error({
        title: 'Warning',
        description: flash.warning,
      });
    }
  }, [props]);
}
