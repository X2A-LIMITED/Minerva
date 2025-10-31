import type { ElementSnapshot } from './types';

export function buildTextFromStoredOriginalData(
    originalData: ElementSnapshot[]
): string {
    const parts: string[] = [];

    for (const record of originalData) {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = record.originalHTML;
        const text = extractTextWithLatex(tempContainer);
        if (text) {
            parts.push(text);
        }
    }

    return parts.join('\n\n');
}

export function extractTextWithLatex(element: HTMLElement): string {
    const latex = extractLatexFromElement(element);
    if (latex) {
        return latex;
    }

    const latexElements = element.querySelectorAll('.ltx_Math, math');
    if (latexElements.length > 0) {
        const clone = element.cloneNode(true) as HTMLElement;

        const cloneLatexElements = Array.from(
            clone.querySelectorAll('.ltx_Math, math')
        );
        cloneLatexElements.forEach(latexEl => {
            const latexNotation = extractLatexFromElement(
                latexEl as HTMLElement
            );
            if (latexNotation) {
                const textNode = document.createTextNode(latexNotation);
                latexEl.replaceWith(textNode);
            }
        });

        return clone.innerText?.trim() || '';
    }

    return element.innerText?.trim() || '';
}

function extractLatexFromElement(element: HTMLElement): string | null {
    if (element.classList.contains('ltx_Math')) {
        const annotation = element.querySelector(
            'annotation[encoding="application/x-tex"]'
        );
        if (annotation && annotation.textContent) {
            return `$${annotation.textContent.trim()}$`;
        }

        const alttext = element.getAttribute('alttext');
        if (alttext) {
            return `$${alttext.trim()}$`;
        }
    }

    if (element.tagName.toLowerCase() === 'math') {
        const annotation = element.querySelector(
            'annotation[encoding="application/x-tex"]'
        );
        if (annotation && annotation.textContent) {
            return `$${annotation.textContent.trim()}$`;
        }
    }

    if (
        element.tagName.toLowerCase() === 'annotation' &&
        element.getAttribute('encoding') === 'application/x-tex'
    ) {
        const latex = element.textContent?.trim();
        if (latex) {
            return `$${latex}$`;
        }
    }

    return null;
}
