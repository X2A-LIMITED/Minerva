import * as v from 'valibot';
import {
    type ModelAvailability,
    type ModelDownloadMonitor,
    BaseClient,
    createOperationResultSchema,
    createDownloadMonitor,
    requiresDownload,
    normalizeAvailability,
} from '../common';

export const SUMMARIZING_RESULT_SCHEMA = createOperationResultSchema({
    summary: v.string(),
});
export type SummarizingResult = v.InferOutput<typeof SUMMARIZING_RESULT_SCHEMA>;

export const SUMMARY_TYPE = {
    TLDR: 'tldr',
    KEY_POINTS: 'key-points',
    TEASER: 'teaser',
    HEADLINE: 'headline',
} as const;
export type SummaryType = (typeof SUMMARY_TYPE)[keyof typeof SUMMARY_TYPE];

export const SUMMARY_LENGTH = {
    SHORT: 'short',
    MEDIUM: 'medium',
    LONG: 'long',
} as const;
export type SummaryLength =
    (typeof SUMMARY_LENGTH)[keyof typeof SUMMARY_LENGTH];

export const SUMMARY_FORMAT = {
    PLAIN_TEXT: 'plain-text',
    MARKDOWN: 'markdown',
};

export const SUMMARIZER_CONFIG_SCHEMA = v.object({
    expectedInputLanguages: v.optional(v.array(v.string())),
    expectedContextLanguages: v.optional(v.array(v.string())),
    sharedContext: v.optional(v.string()),
    type: v.optional(v.enum(SUMMARY_TYPE)),
    format: v.optional(v.enum(SUMMARY_FORMAT)),
    length: v.optional(v.enum(SUMMARY_LENGTH)),
    outputLanguage: v.optional(v.string()),
    signal: v.optional(v.instance(AbortSignal)),
    monitor: v.optional(
        v.function() as v.GenericSchema<(monitor: ModelDownloadMonitor) => void>
    ),
});
export type SummarizerConfig = v.InferOutput<typeof SUMMARIZER_CONFIG_SCHEMA>;

export const SUMMARIZER_OPTIONS = v.object({
    context: v.optional(v.string()),
    signal: v.optional(v.instance(AbortSignal)),
});
export type SummarizeOptions = v.InferOutput<typeof SUMMARIZER_OPTIONS>;

export const SUMMARIZE_REQUEST = v.object({
    text: v.string(),
    config: SUMMARIZER_CONFIG_SCHEMA,
    options: v.optional(SUMMARIZER_OPTIONS),
});
export type SummarizeRequest = v.InferOutput<typeof SUMMARIZE_REQUEST>;

export const SUMMARIZER_MESSAGE_KIND = {
    SUMMARIZE_CONTENT: 'SUMMARIZE_CONTENT',
    SUMMARIZE_RESULT: 'SUMMARIZE_RESULT',
} as const;
export const SUMMARIZE_CONTENT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(SUMMARIZER_MESSAGE_KIND.SUMMARIZE_CONTENT),
    requestId: v.number(),
    ...SUMMARIZE_REQUEST.entries,
});
export const SUMMARIZE_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(SUMMARIZER_MESSAGE_KIND.SUMMARIZE_RESULT),
    requestId: v.number(),
    result: SUMMARIZING_RESULT_SCHEMA,
});
export type SummarizeResultMessage = v.InferOutput<
    typeof SUMMARIZE_RESULT_MESSAGE_SCHEMA
>;
export const SUMMARIZER_MESSAGE_SCHEMA = v.variant('kind', [
    SUMMARIZE_CONTENT_MESSAGE_SCHEMA,
    SUMMARIZE_RESULT_MESSAGE_SCHEMA,
]);
export type SummarizerMessage = v.InferOutput<typeof SUMMARIZER_MESSAGE_SCHEMA>;
export type SummarizerMessageKind = SummarizerMessage['kind'];

type SummarizerAvailability = ModelAvailability;

type SummarizerAvailabilityOptions = Omit<SummarizerConfig, 'sharedContext'>;

type SummarizerInstance = {
    summarize(text: string, options?: SummarizeOptions): Promise<string>;
};

type SummarizerFactory = {
    availability(
        options: SummarizerAvailabilityOptions
    ): SummarizerAvailability | Promise<SummarizerAvailability>;
    create(options: SummarizerConfig): Promise<SummarizerInstance>;
};

declare global {
    interface Window {
        Summarizer?: SummarizerFactory;
    }
}

export interface CustomSummarizer {
    summarize(request: SummarizeRequest): Promise<SummarizingResult>;
}

export class ClientSummarizer
    extends BaseClient<SummarizingResult>
    implements CustomSummarizer
{
    async summarize({
        text,
        config,
        options,
    }: SummarizeRequest): Promise<SummarizingResult> {
        const [, result] = await this.sendRequest(
            {
                kind: SUMMARIZER_MESSAGE_KIND.SUMMARIZE_CONTENT,
                text,
                config,
                options,
            },
            SUMMARIZE_RESULT_MESSAGE_SCHEMA
        );

        return result;
    }
}

export class ServerSummarizer implements CustomSummarizer {
    #sharedContext: string;

    constructor(sharedContext?: string) {
        this.#sharedContext = sharedContext || 'Web page summary';
    }

    async summarize({
        text,
        config,
        options,
    }: SummarizeRequest): Promise<SummarizingResult> {
        if (!('Summarizer' in window)) {
            return { kind: 'not-supported' };
        }

        const signal = options?.signal;
        const Summarizer = window.Summarizer;
        if (!Summarizer) {
            return { kind: 'not-supported' };
        }

        const availabilityOptions: SummarizerAvailabilityOptions = {
            type: config.type,
            format: config.format ?? 'plain-text',
            length: config.length,
            outputLanguage: config.outputLanguage ?? 'en',
            expectedInputLanguages: config.expectedInputLanguages ?? ['en'],
            expectedContextLanguages: config.expectedContextLanguages ?? ['en'],
        };

        const availability = await Summarizer.availability(availabilityOptions);
        const availabilityStatus = normalizeAvailability(availability);

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const summarizer = await Summarizer.create({
            ...availabilityOptions,
            sharedContext: this.#sharedContext,
            signal,
            ...(requiresDownload(availabilityStatus)
                ? {
                      monitor: createDownloadMonitor(
                          'Summarizer',
                          config.monitor
                      ),
                  }
                : {}),
        });
        const summary = await summarizer.summarize(text, {
            context: options?.context,
            signal,
        });

        if (signal?.aborted) {
            return { kind: 'aborted' };
        }

        return { kind: 'success', summary };
    }
}

export function isSummaryType(value: unknown): value is SummaryType {
    if (typeof value !== 'string') {
        return false;
    }

    const allowed_values: string[] = Object.values(SUMMARY_TYPE);

    return allowed_values.includes(value);
}

export function isSummaryLength(value: unknown): value is SummaryLength {
    if (typeof value !== 'string') {
        return false;
    }

    const allowed_values: string[] = Object.values(SUMMARY_LENGTH);

    return allowed_values.includes(value);
}
