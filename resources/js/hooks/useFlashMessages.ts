import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { sileo } from 'sileo';

interface FlashMessages {
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
}

export function useFlashMessages() {
  const { props } = usePage();

  useEffect(() => {
    const flash = (props as any).flash as FlashMessages | undefined;

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
