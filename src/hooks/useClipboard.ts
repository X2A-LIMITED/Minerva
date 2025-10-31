import { useCallback } from 'react';

export type UseClipboardReturns = {
    copy(value: string): Promise<boolean>;
};

export function useClipboard(): UseClipboardReturns {
    const copy = useCallback(async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (err: unknown) {
            return false;
        }
    }, []);

    return { copy };
}
