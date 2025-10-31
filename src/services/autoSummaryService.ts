import type { Settings } from '../contexts/settings';
import type { SelectionResult } from '../selection/AreaSelectionController';

const MIN_PARAGRAPH_LENGTH = 200;
const SUMMARY_ATTRIBUTE = 'data-minerva-auto-summary';

export function isUrlWhitelisted(url: string, whitelist: string[]): boolean {
    if (whitelist.length === 0) return false;

    const currentUrl = url.toLowerCase();

    return whitelist.some(pattern => {
        const normalizedPattern = pattern.toLowerCase().trim();
        if (!normalizedPattern) return false;

        if (normalizedPattern.includes('*')) {
            const regexPattern = normalizedPattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(currentUrl);
        }

        return currentUrl.includes(normalizedPattern);
    });
}

export function findSummarizableParagraphs(
    doc: Document = document
): HTMLElement[] {
    const paragraphs: HTMLElement[] = [];

    const elements = doc.querySelectorAll('p, article, section');

    elements.forEach(element => {
        const el = element as HTMLElement;

        if (el.hasAttribute(SUMMARY_ATTRIBUTE)) return;

        const text = el.textContent?.trim() || '';
        if (text.length < MIN_PARAGRAPH_LENGTH) return;

        if (el.closest('pre, code, script, style')) return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        paragraphs.push(el);
    });

    return paragraphs;
}

function createSelectionResult(element: HTMLElement): SelectionResult {
    const rect = element.getBoundingClientRect();

    return {
        doc: element.ownerDocument,
        elements: [element],
        text: element.textContent?.trim() || '',
        bounds: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
        },
    };
}

export async function startAutoSummary(
    settings: Settings,
    onAreaSelect: (result: SelectionResult) => Promise<void>
): Promise<void> {
    if (!settings.autoSummaryEnabled) return;

    const currentUrl = window.location.href;
    if (!isUrlWhitelisted(currentUrl, settings.autoSummaryWhitelist)) {
        console.log('[AutoSummary] URL not whitelisted:', currentUrl);
        return;
    }

    console.log('[AutoSummary] Starting auto-summary on:', currentUrl);

    const paragraphs = findSummarizableParagraphs();
    console.log('[AutoSummary] Found paragraphs:', paragraphs.length);

    for (let i = 0; i < paragraphs.length; i++) {
        const element = paragraphs[i];

        element.setAttribute(SUMMARY_ATTRIBUTE, 'true');

        const selectionResult = createSelectionResult(element);
        await onAreaSelect(selectionResult);

        if (i < paragraphs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log('[AutoSummary] Completed auto-summary');
}

export function stopAutoSummary(doc: Document = document): void {
    const elements = doc.querySelectorAll(`[${SUMMARY_ATTRIBUTE}]`);
    elements.forEach(element => {
        element.removeAttribute(SUMMARY_ATTRIBUTE);
    });
}
