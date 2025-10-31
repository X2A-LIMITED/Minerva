import { useCallback, useMemo, useReducer, type ActionDispatch } from 'react';
import { extensionStorage } from '../utils/extensionStorage';

export type UseLocalStorageReturns<T> = {
    getValue: () => Promise<T | null>;
    setValue: (newValue: T) => Promise<void>;
};

export function useLocalStorage<T>(key: string): UseLocalStorageReturns<T> {
    const getValue = useCallback(async () => {
        return await extensionStorage.getItem<T>(key);
    }, [key]);

    const setValue = useCallback(
        async (value: T) => {
            await extensionStorage.setItem(key, value);
        },
        [key]
    );

    return {
        getValue,
        setValue,
    };
}

export function useLocalStorageReducer<
    S extends {},
    A,
    E extends keyof S & string,
>(
    key: string,
    reducer: (state: S, action: A) => S,
    defaultValue: S,
    exclude?: E[]
): [S, ActionDispatch<[action: A]>] {
    const { getValue, setValue } = useLocalStorage<any>(key);
    const excludeSet = useMemo(() => new Set<string>(exclude), [exclude]);

    return useReducer(
        (state, action) => {
            const newState = reducer(state, action);
            const toSave = exclude
                ? Object.fromEntries(
                      Object.entries(newState).filter(
                          ([key]) => !excludeSet.has(key)
                      )
                  )
                : newState;

            setValue(toSave).catch(err => {
                console.error('Failed to save to extension storage:', err);
            });
            return newState;
        },
        defaultValue,
        defaultValue => {
            // Initialize from storage asynchronously
            getValue()
                .then(stored => {
                    if (stored) {
                        // This won't trigger on initial render, but storage will be loaded
                        // Users of this hook may need to handle async initialization separately
                    }
                })
                .catch(err => {
                    console.error(
                        'Failed to load from extension storage:',
                        err
                    );
                });
            return defaultValue;
        }
    );
}
