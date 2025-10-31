import { useCallback, useState } from 'react';
import { useActive } from './useActive';

export type UsePromptOverlayProps = {
    initialValues?: {
        isActive?: boolean;
        isWebpageModeEnabled?: boolean;
    };
};

export type UsePromptOverlayReturns = {
    isActive: boolean;
    isWebpageModeEnabled: boolean;
    open: () => void;
    close: () => void;
    toggleIsWebpageModeEnabled: () => void;
};

export function usePromptOverlay({
    initialValues,
}: UsePromptOverlayProps): UsePromptOverlayReturns {
    const {
        isActive,
        activate: open,
        deactivate: close,
    } = useActive({ initialValue: initialValues?.isActive ?? false });
    const [isWebpageModeEnabled, setIsWebpageModeEnabled] = useState<boolean>(
        initialValues?.isWebpageModeEnabled ?? false
    );
    const toggleIsWebpageModeEnabled = useCallback(
        () => setIsWebpageModeEnabled(previous => !previous),
        []
    );

    return {
        isActive,
        isWebpageModeEnabled,
        open,
        close,
        toggleIsWebpageModeEnabled,
    };
}
