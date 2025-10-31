export interface AssistantIconData {
    icon: string;
    name: string;
}

export function updateAssistantIconInControlItem(
    controlItem: HTMLElement,
    assistant: AssistantIconData
): void {
    const iconContainer = controlItem.querySelector(
        '.minerva-control-item__icon'
    );
    if (!iconContainer) return;

    iconContainer.innerHTML = '';

    if (
        assistant.icon.startsWith('http') ||
        assistant.icon.startsWith('chrome-extension://')
    ) {
        const img = document.createElement('img');
        img.src = assistant.icon;
        img.alt = assistant.name;
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.objectFit = 'contain';
        iconContainer.appendChild(img);
    } else {
        const textElement = document.createElement('span');
        textElement.className = 'minerva-control-item__emoji';
        textElement.textContent = assistant.icon;
        iconContainer.appendChild(textElement);
        iconContainer.classList.add('minerva-control-item__icon--emoji');
    }
}

export function createAssistantIcon(
    assistant: AssistantIconData
): string | HTMLImageElement {
    if (
        assistant.icon.startsWith('http') ||
        assistant.icon.startsWith('chrome-extension://')
    ) {
        return createAssistantIconImage(assistant.icon, assistant.name);
    } else {
        return assistant.icon;
    }
}

export function createAssistantIconImage(
    src: string,
    alt: string = 'Assistant'
): HTMLImageElement {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'minerva-assistant-icon-img';
    img.style.width = '20px';
    img.style.height = '20px';
    img.style.objectFit = 'contain';
    return img;
}

export function renderAssistantIconInElement(
    container: HTMLElement,
    icon: string,
    alt: string = 'Assistant'
): void {
    container.innerHTML = '';

    if (icon.startsWith('http') || icon.startsWith('chrome-extension://')) {
        const img = createAssistantIconImage(icon, alt);
        container.appendChild(img);
    } else {
        container.textContent = icon;
    }
}
