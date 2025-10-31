export interface ExtensionStorage {
    getItem<T = any>(key: string): Promise<T | null>;
    setItem<T = any>(key: string, value: T): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}

class ChromeExtensionStorage implements ExtensionStorage {
    async getItem<T = any>(key: string): Promise<T | null> {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] !== undefined ? result[key] : null;
        } catch (error) {
            console.error(
                `Error getting item "${key}" from extension storage:`,
                error
            );
            return null;
        }
    }

    async setItem<T = any>(key: string, value: T): Promise<void> {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            console.error(
                `Error setting item "${key}" in extension storage:`,
                error
            );
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await chrome.storage.local.remove(key);
        } catch (error) {
            console.error(
                `Error removing item "${key}" from extension storage:`,
                error
            );
        }
    }

    async clear(): Promise<void> {
        try {
            await chrome.storage.local.clear();
        } catch (error) {
            console.error('Error clearing extension storage:', error);
        }
    }
}

export const extensionStorage: ExtensionStorage = new ChromeExtensionStorage();

export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
    for (const key of keys) {
        try {
            const localValue = localStorage.getItem(key);
            if (localValue !== null) {
                const parsedValue = tryParseJSON(localValue);
                await extensionStorage.setItem(key, parsedValue);
                console.log(
                    `Migrated "${key}" from localStorage to extension storage`
                );
            }
        } catch (error) {
            console.error(`Error migrating "${key}":`, error);
        }
    }
}

function tryParseJSON(value: string): any {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}
