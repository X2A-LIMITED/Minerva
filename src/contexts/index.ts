import type React from 'react';
import { useContext } from 'react';

export * from './settings';

export function useContextNotNull<T>(context: React.Context<T | null>): T {
    const value = useContext(context);

    if (value === null) {
        throw new Error('unexpected null context');
    }

    return value;
}
