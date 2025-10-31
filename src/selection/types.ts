import type { SummarizerConfig } from '../genAI/summarizer/summarizeAPI';

export interface ElementSnapshot {
    element: HTMLElement;
    originalHTML: string;
    originalStyle: string;
    originalClass: string;
    originalAttributes: Record<string, string>;
}

export interface SummaryState {
    summary: string;
    originalText: string;
    options: SummarizerConfig;
    originalData: OriginalElementRecord[];
    cacheKey: string;
    promptCacheKey: string;
}

export interface OriginalElementRecord extends ElementSnapshot {
    summaryState?: SummaryState;
}
