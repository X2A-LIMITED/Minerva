export interface LinkedRange {
    start: number;
    end: number;
    href: string;
    matchedText: string;
}

export function findLinkRanges(
    textContent: string,
    linkMappings: Map<string, string>
): LinkedRange[] {
    const linkedRanges: LinkedRange[] = [];
    const sortedLinkTexts = Array.from(linkMappings.keys()).sort(
        (a, b) => b.length - a.length
    );

    sortedLinkTexts.forEach(linkText => {
        const href = linkMappings.get(linkText);
        if (!href) {
            return;
        }

        const escapedLinkText = linkText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedLinkText}\\b`, 'gi');

        let match: RegExpExecArray | null;
        while ((match = regex.exec(textContent)) !== null) {
            const start = match.index;
            const end = start + match[0].length;

            const overlaps = linkedRanges.some(
                range =>
                    (start >= range.start && start < range.end) ||
                    (end > range.start && end <= range.end)
            );

            if (!overlaps) {
                linkedRanges.push({
                    start,
                    end,
                    href,
                    matchedText: match[0],
                });
            }
        }
    });

    return linkedRanges.sort((a, b) => a.start - b.start);
}

export function createLinkifiedFragment(
    doc: Document,
    textContent: string,
    linkedRanges: LinkedRange[],
    linkClassName: string = 'minerva-summary-link'
): DocumentFragment {
    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;

    linkedRanges.forEach(range => {
        if (range.start > lastIndex) {
            fragment.appendChild(
                doc.createTextNode(
                    textContent.substring(lastIndex, range.start)
                )
            );
        }

        const linkElement = doc.createElement('a');
        linkElement.href = range.href;
        linkElement.textContent = range.matchedText;
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        linkElement.className = linkClassName;
        fragment.appendChild(linkElement);

        lastIndex = range.end;
    });

    if (lastIndex < textContent.length) {
        fragment.appendChild(
            doc.createTextNode(textContent.substring(lastIndex))
        );
    }

    return fragment;
}

export function linkifyTextNode(
    doc: Document,
    textNode: Text,
    linkMappings: Map<string, string>,
    linkClassName: string = 'minerva-summary-link'
): void {
    const textContent = textNode.nodeValue ?? '';
    if (!textContent) {
        return;
    }

    const linkedRanges = findLinkRanges(textContent, linkMappings);

    if (linkedRanges.length === 0) {
        return;
    }

    const fragment = createLinkifiedFragment(
        doc,
        textContent,
        linkedRanges,
        linkClassName
    );
    textNode.replaceWith(fragment);
}

export function linkifyElement(
    doc: Document,
    container: HTMLElement,
    linkMappings: Map<string, string>,
    linkClassName: string = 'minerva-summary-link'
): void {
    if (linkMappings.size === 0) {
        return;
    }

    const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode = walker.nextNode();

    while (currentNode) {
        const textNode = currentNode as Text;
        const value = textNode.nodeValue ?? '';
        const parentElement = textNode.parentElement;

        if (
            value.trim().length > 0 &&
            !(parentElement && parentElement.closest('a'))
        ) {
            linkifyTextNode(doc, textNode, linkMappings, linkClassName);
        }

        currentNode = walker.nextNode();
    }
}
