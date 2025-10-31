import { extensionStorage } from '../../utils/extensionStorage';

export interface ControlBarPosition {
    x: number;
    y: number;
}

export interface AssistantConfig {
    id: string;
    name: string;
    icon: string;
    isCustom?: boolean;
}

export async function getSavedControlBarPosition(): Promise<ControlBarPosition | null> {
    return await extensionStorage.getItem<ControlBarPosition>(
        'minerva-control-bar-position'
    );
}

export async function saveControlBarPosition(
    position: ControlBarPosition
): Promise<void> {
    await extensionStorage.setItem('minerva-control-bar-position', position);
}

export async function getSelectedAssistant(): Promise<AssistantConfig> {
    const saved = await extensionStorage.getItem<AssistantConfig>(
        'minerva-selected-assistant'
    );

    if (saved) {
        return saved;
    }

    return {
        id: 'default',
        name: 'Default',
        icon: '👤',
        isCustom: false,
    };
}

export async function saveSelectedAssistant(
    assistant: AssistantConfig
): Promise<void> {
    await extensionStorage.setItem('minerva-selected-assistant', assistant);
}

export async function getCustomAssistants(): Promise<AssistantConfig[]> {
    const saved = await extensionStorage.getItem<AssistantConfig[]>(
        'minerva-custom-assistants'
    );
    return saved || [];
}

export async function saveCustomAssistants(
    assistants: AssistantConfig[]
): Promise<void> {
    await extensionStorage.setItem('minerva-custom-assistants', assistants);
}

export async function addCustomAssistant(
    assistant: AssistantConfig
): Promise<void> {
    const assistants = await getCustomAssistants();
    assistants.push(assistant);
    await saveCustomAssistants(assistants);
}
