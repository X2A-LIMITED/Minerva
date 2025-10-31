import {
    CONTENT_SELECTORS,
    EXCLUDED_CLASSES,
    EXCLUDED_CONTAINER_CLASSES,
} from './constants';

export interface LinkMapping {
    text: string;
    href: string;
    normalizedText: string;
}

export type Section = {
    heading?: HTMLElement;
    paragraphs: HTMLElement[];
    links?: LinkMapping[];
};

export interface CustomExtractor {
    extractSections(doc: Document): Section[];
}

export class GenericExtractor implements CustomExtractor {
    constructor() {}

    extractSections(doc: Document): Section[] {
        const mainContent = (doc.querySelector(CONTENT_SELECTORS) ??
            doc.querySelector('.fig-content-body') ??
            doc.body) as HTMLElement;
        const sections: Section[] = [];
        let currentSection: Section = { paragraphs: [] };

        const allElements = mainContent.querySelectorAll(
            'h1, h2, h3, h4, h5, h6, p'
        );

        for (const element of allElements) {
            const tagName = element.tagName.toLowerCase();

            if (tagName[0] === 'h' && tagName.length === 2) {
                if (currentSection.paragraphs.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: element as HTMLElement,
                    paragraphs: [],
                };
            } else if (tagName === 'p') {
                const htmlElement = element as HTMLElement;
                const text = (htmlElement.innerText || '').trim();

                if (
                    text.length <= 20 ||
                    isInsideExcludedContainer(element) ||
                    Array.from(htmlElement.classList).some(cls =>
                        EXCLUDED_CLASSES.has(cls)
                    )
                ) {
                    continue;
                }

                currentSection.paragraphs.push(htmlElement);
            }
        }

        if (currentSection.paragraphs.length > 0) {
            sections.push(currentSection);
        }

        for (let i = 0; i < sections.length; i++) {
            sections[i].links = extractLinksFromParagraphs(
                sections[i].paragraphs
            );
            console.debug(
                `[Content Script] Section ${i + 1} - Extracted ${
                    sections[i].links!.length
                } links`
            );
        }

        console.debug(
            '[Content Script] Found',
            sections.length,
            'sections with paragraphs'
        );
        return sections;
    }
}

export function isInsideExcludedContainer(element: Element): boolean {
    let parent = element.parentElement;
    while (parent) {
        const classList = parent.classList;
        for (const excludedClass of EXCLUDED_CONTAINER_CLASSES) {
            if (classList.contains(excludedClass)) {
                return true;
            }
        }
        parent = parent.parentElement;
    }
    return false;
}

export function extractLinksFromParagraphs(
    paragraphs: HTMLElement[]
): LinkMapping[] {
    const links: LinkMapping[] = [];
    const seenLinks = new Set<string>();

    const MAX_LINKS = 50;

    for (const paragraph of paragraphs) {
        if (links.length >= MAX_LINKS) {
            console.debug('[Links] Early termination - max links reached');
            break;
        }

        const anchors =
            paragraph.querySelectorAll<HTMLAnchorElement>('a[href]');

        for (const anchor of anchors) {
            if (links.length >= MAX_LINKS) break;

            const href = anchor.getAttribute('href');
            const text = (anchor.textContent || '').trim();

            if (!text || !href) continue;
            if (text.length > 100) continue;

            const normalizedText = text.toLowerCase();
            const key = `${normalizedText}|${href}`;

            if (!seenLinks.has(key)) {
                seenLinks.add(key);
                links.push({ text, href, normalizedText });
            }
        }
    }

    console.debug(
        '[Links] Extracted',
        links.length,
        'unique links from paragraphs'
    );
    return links;
}
