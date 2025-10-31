import { useCallback, useState } from 'react';

export type UseActiveProps = {
    initialValue?: boolean;
};

export type UseActiveReturns = {
    isActive: boolean;
    activate: () => void;
    deactivate: () => void;
    toggle: () => void;
    set: (value: boolean) => void;
};

export function useActive({ initialValue }: UseActiveProps): UseActiveReturns {
    const [isActive, setIsActive] = useState<boolean>(initialValue ?? false);
    const activate = useCallback(() => setIsActive(true), []);
    const deactivate = useCallback(() => setIsActive(false), []);
    const toggle = useCallback(() => setIsActive(previous => !previous), []);

    return {
        isActive,
        activate,
        deactivate,
        toggle,
        set: setIsActive,
    };
}
