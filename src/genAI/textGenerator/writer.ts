import * as v from 'valibot';
import {
    type ModelAvailability,
    type BaseModelConfig,
    type ModelDownloadMonitor,
    BaseClient,
    createOperationResultSchema,
    safeAvailabilityCheck,
    normalizeAvailability,
    createDownloadMonitor,
    requiresDownload,
    SessionManager,
    type SessionWithDestroy,
} from '../common.ts';

export const WRITING_RESULT_SCHEMA = createOperationResultSchema({
    text: v.string(),
});
export type WritingResult = v.InferOutput<typeof WRITING_RESULT_SCHEMA>;

export const WRITER_MESSAGE_KIND = {
    WRITE_TEXT: 'WRITE_TEXT',
    WRITE_RESULT: 'WRITE_RESULT',
} as const;

export type WriterConfig = BaseModelConfig;

export type WriteOptions = {
    context?: string;
    tone?: string;
};

export type WriteRequest = {
    config?: WriterConfig;
    options?: WriteOptions;
    signal?: AbortSignal;
};

export const WRITE_TEXT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(WRITER_MESSAGE_KIND.WRITE_TEXT),
    requestId: v.number(),
    text: v.string(),
    request: v.optional(v.any()),
});

export const WRITE_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(WRITER_MESSAGE_KIND.WRITE_RESULT),
    requestId: v.number(),
    result: WRITING_RESULT_SCHEMA,
});

export type WriterMessage =
    | v.InferOutput<typeof WRITE_TEXT_MESSAGE_SCHEMA>
    | v.InferOutput<typeof WRITE_RESULT_MESSAGE_SCHEMA>;
export type WriterMessageKind = WriterMessage['kind'];

type WriterAvailability = ModelAvailability;

type WriterAvailabilityOptions = {
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
};

type WriterCreateOptions = BaseModelConfig & {
    signal?: AbortSignal;
    monitor?: (monitor: ModelDownloadMonitor) => void;
};

type WriterInstance = SessionWithDestroy & {
    write(text: string, options?: WriteOptions): Promise<string>;
    writeStreaming?(
        text: string,
        options?: WriteOptions
    ): AsyncIterable<unknown> | null | undefined;
};

type WriterFactory = {
    availability(
        options?: WriterAvailabilityOptions
    ): WriterAvailability | Promise<WriterAvailability>;
    create(options?: WriterCreateOptions): Promise<WriterInstance>;
};

declare global {
    interface Window {
        Writer?: WriterFactory;
    }
}

export interface CustomWriter {
    write(text: string, request?: WriteRequest): Promise<WritingResult>;
}

export class ClientWriter
    extends BaseClient<WritingResult>
    implements CustomWriter
{
    async write(text: string, request?: WriteRequest): Promise<WritingResult> {
        const [, result] = await this.sendRequest(
            {
                kind: WRITER_MESSAGE_KIND.WRITE_TEXT,
                text,
                request,
            },
            WRITE_RESULT_MESSAGE_SCHEMA
        );

        return result;
    }
}

export class ServerWriter implements CustomWriter {
    #sessionManager: SessionManager<
        WriterInstance,
        WriterFactory,
        WriterCreateOptions,
        WriterCreateOptions
    >;

    constructor() {
        this.#sessionManager = new SessionManager('Writer');
    }

    async write(text: string, request?: WriteRequest): Promise<WritingResult> {
        if (!('Writer' in window)) {
            return { kind: 'not-supported' };
        }

        const Writer = window.Writer;
        if (!Writer) {
            return { kind: 'not-supported' };
        }

        const signal = request?.signal;

        const availabilityOptions: WriterAvailabilityOptions = {
            expectedInputLanguages: request?.config?.expectedInputLanguages ?? [
                'en',
            ],
            expectedContextLanguages: request?.config
                ?.expectedContextLanguages ??
                request?.config?.expectedInputLanguages ?? ['en'],
            outputLanguage: request?.config?.outputLanguage ?? 'en',
        };

        const availabilityResponse = await safeAvailabilityCheck(
            Writer,
            availabilityOptions,
            'Writer'
        );
        const availabilityStatus = normalizeAvailability(availabilityResponse);

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            Writer,
            {
                sharedContext:
                    request?.config?.sharedContext ??
                    'Write webpage summaries for younger readers',
                expectedInputLanguages:
                    availabilityOptions.expectedInputLanguages,
                expectedContextLanguages:
                    availabilityOptions.expectedContextLanguages,
                outputLanguage: availabilityOptions.outputLanguage,
                tone: request?.config?.tone,
            },
            availabilityStatus,
            (factory, options) => factory.create(options),
            (config, status) => ({
                ...config,
                signal,
                ...(requiresDownload(status)
                    ? { monitor: createDownloadMonitor('Writer') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        try {
            const written = await sessionResult.session.write(
                text,
                request?.options ?? {}
            );

            if (signal?.aborted) {
                return { kind: 'aborted' };
            }

            return { kind: 'success', text: written };
        } catch (error) {
            console.error('[Page Script] Failed to write text:', error);
            if (signal?.aborted) {
                return { kind: 'aborted' };
            }
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    destroy(): void {
        this.#sessionManager.destroy();
    }
}
