import { renderReactComponent } from '../ui/utils';
import {
    InlineSummary,
    type SummaryType,
    type SummaryLength,
} from '../ui/organisms';
import type { LinkMapping } from '../ui/molecules/SummaryTextWithLinks';
import type {
    CustomSummarizer,
    SummarizerConfig,
} from '../genAI/summarizer/summarizeAPI.ts';
import type { CustomRewriter } from '../genAI/textGenerator/rewriter.ts';
import type { CustomLanguageModel } from '../genAI/languageModel';

interface StyleSnapshot {
    background: string;
    color: string;
    padding: string;
    borderRadius: string;
    display: string;
    inlineStyle: string;
}

export interface InlineSummaryControllerProps {
    doc: Document;
    elements: HTMLElement[];
    originalText: string;
    summarizer: CustomSummarizer;
    rewriter: CustomRewriter;
    languageModel: CustomLanguageModel;
    config: SummarizerConfig;
}

export class InlineSummaryController {
    #elements: HTMLElement[];
    #originalText: string;
    #summarizer: CustomSummarizer;
    #rewriter: CustomRewriter;
    #languageModel: CustomLanguageModel;
    #config: SummarizerConfig;

    #styleSnapshots = new WeakMap<HTMLElement, StyleSnapshot>();

    #summaryUI: HTMLElement | null = null;

    constructor(props: InlineSummaryControllerProps) {
        this.#elements = props.elements;
        this.#originalText = props.originalText;
        this.#summarizer = props.summarizer;
        this.#rewriter = props.rewriter;
        this.#languageModel = props.languageModel;
        this.#config = props.config;
    }

    async show(): Promise<void> {
        this.#saveSnapshots();

        this.#applyLoadingBackground();

        const links = this.#extractLinks();

        this.#summaryUI = renderReactComponent(InlineSummary, {
            originalText: this.#originalText,
            summarizer: this.#summarizer,
            rewriter: this.#rewriter,
            languageModel: this.#languageModel,
            config: this.#config,
            links,
            onCopySummary: (summary: string) => this.#handleCopy(summary),
            onUndo: () => this.undo(),
            initialType: (this.#config.type as SummaryType) || 'tldr',
            initialLength: (this.#config.length as SummaryLength) || 'medium',
            showPromptControls: true,
            showRewriteControls: true,
            apiKey: '',
            requestApiKey: () => undefined,
        });

        this.#replaceElements();
    }

    hide(): void {
        this.undo();
    }

    undo(): void {
        this.#restoreElements();
        this.#summaryUI = null;
    }

    #saveSnapshots(): void {
        for (const element of this.#elements) {
            if (!this.#styleSnapshots.has(element)) {
                this.#styleSnapshots.set(element, {
                    background: element.style.background || '',
                    color: element.style.color || '',
                    padding: element.style.padding || '',
                    borderRadius: element.style.borderRadius || '',
                    display: element.style.display || '',
                    inlineStyle: element.getAttribute('style') ?? '',
                });
            }
        }
    }

    #restoreElements(): void {
        for (const element of this.#elements) {
            const snapshot = this.#styleSnapshots.get(element);
            if (snapshot) {
                element.style.cssText = snapshot.inlineStyle;
                element.style.display = snapshot.display;
                this.#styleSnapshots.delete(element);
            }

            element.style.display = '';
        }

        if (this.#summaryUI) {
            this.#summaryUI.remove();
        }
    }

    #applyLoadingBackground(): void {
        for (const element of this.#elements) {
            element.style.background =
                'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
            element.style.backgroundSize = '200% 100%';
            element.style.animation = 'shimmer 1.5s infinite';
        }
    }

    #replaceElements(): void {
        if (!this.#summaryUI) return;

        for (const element of this.#elements) {
            element.style.display = 'none';
        }

        if (this.#elements.length > 0) {
            const firstElement = this.#elements[0];
            if (firstElement.parentNode) {
                firstElement.parentNode.insertBefore(
                    this.#summaryUI,
                    firstElement.nextSibling
                );
            }
        }
    }

    #extractLinks(): LinkMapping[] {
        const links: LinkMapping[] = [];
        const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

        for (const element of this.#elements) {
            const html = element.innerHTML;
            let match;
            while ((match = linkRegex.exec(html)) !== null) {
                links.push({
                    text: match[2],
                    href: match[1],
                });
            }
        }

        return links;
    }

    async #handleCopy(summary: string): Promise<void> {
        if (!summary) {
            return;
        }

        try {
            await navigator.clipboard.writeText(summary);
        } catch (error) {
            console.error(
                '[InlineSummaryController] Failed to copy answer:',
                error
            );
        }
    }
}
