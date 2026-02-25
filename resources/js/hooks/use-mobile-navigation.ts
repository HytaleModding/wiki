import { useCallback } from 'react';

export type CleanupFn = () => void;

export function useMobileNavigation(): CleanupFn {
    return useCallback(() => {
        document.body.style.removeProperty('pointer-events');
    }, []);
}
