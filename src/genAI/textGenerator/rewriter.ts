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

export const REWRITING_RESULT_SCHEMA = createOperationResultSchema({
    text: v.string(),
});
export type RewritingResult = v.InferOutput<typeof REWRITING_RESULT_SCHEMA>;

export const REWRITER_MESSAGE_KIND = {
    REWRITE_TEXT: 'REWRITE_TEXT',
    REWRITE_RESULT: 'REWRITE_RESULT',
} as const;

export const REWRITER_CONFIG_SCHEMA = v.object({
    sharedContext: v.optional(v.string()),
    expectedInputLanguages: v.optional(v.array(v.string())),
    expectedContextLanguages: v.optional(v.array(v.string())),
    outputLanguage: v.optional(v.string()),
    tone: v.optional(v.string()),
});
export type RewriterConfig = v.InferOutput<typeof REWRITER_CONFIG_SCHEMA>;

export const REWRITE_OPTIONS_SCHEMA = v.object({
    context: v.optional(v.string()),
    tone: v.optional(v.string()),
});
export type RewriteOptions = v.InferOutput<typeof REWRITE_OPTIONS_SCHEMA>;

export const REWRITE_REQUEST_SCHEMA = v.object({
    config: v.optional(REWRITER_CONFIG_SCHEMA),
    options: v.optional(REWRITE_OPTIONS_SCHEMA),
    signal: v.optional(v.instance(AbortSignal)),
});
export type RewriteRequest = v.InferOutput<typeof REWRITE_REQUEST_SCHEMA>;

export const REWRITE_TEXT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(REWRITER_MESSAGE_KIND.REWRITE_TEXT),
    requestId: v.number(),
    text: v.string(),
    request: v.optional(REWRITE_REQUEST_SCHEMA),
});
export type RewriteTextMessage = v.InferOutput<
    typeof REWRITE_TEXT_MESSAGE_SCHEMA
>;
export const REWRITE_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(REWRITER_MESSAGE_KIND.REWRITE_RESULT),
    requestId: v.number(),
    result: REWRITING_RESULT_SCHEMA,
});
export type RewriteResultMessage = v.InferOutput<
    typeof REWRITE_RESULT_MESSAGE_SCHEMA
>;
export const REWRITER_MESSAGE_SCHEMA = v.variant('kind', [
    REWRITE_TEXT_MESSAGE_SCHEMA,
    REWRITE_RESULT_MESSAGE_SCHEMA,
]);
export type RewriterMessage = v.InferOutput<typeof REWRITER_MESSAGE_SCHEMA>;
export type RewriterMessageKind = RewriterMessage['kind'];

type RewriterAvailability = ModelAvailability;

type RewriterAvailabilityOptions = {
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
};

type RewriterCreateOptions = BaseModelConfig & {
    signal?: AbortSignal;
    monitor?: (monitor: ModelDownloadMonitor) => void;
};

type RewriterInstance = SessionWithDestroy & {
    rewrite(text: string, options?: RewriteOptions): Promise<string>;
    rewriteStreaming?(
        text: string,
        options?: RewriteOptions
    ): AsyncIterable<unknown> | null | undefined;
};

type RewriterFactory = {
    availability(
        options?: RewriterAvailabilityOptions
    ): RewriterAvailability | Promise<RewriterAvailability>;
    create(options?: RewriterCreateOptions): Promise<RewriterInstance>;
};

declare global {
    interface Window {
        Rewriter?: RewriterFactory;
    }
}

export interface CustomRewriter {
    rewrite(text: string, request?: RewriteRequest): Promise<RewritingResult>;
}

export class ClientRewriter
    extends BaseClient<RewritingResult>
    implements CustomRewriter
{
    async rewrite(
        text: string,
        request?: RewriteRequest
    ): Promise<RewritingResult> {
        const [, result] = await this.sendRequest(
            {
                kind: REWRITER_MESSAGE_KIND.REWRITE_TEXT,
                text,
                request,
            },
            REWRITE_RESULT_MESSAGE_SCHEMA
        );

        return result;
    }
}

export class ServerRewriter implements CustomRewriter {
    #sessionManager: SessionManager<
        RewriterInstance,
        RewriterFactory,
        RewriterCreateOptions,
        RewriterCreateOptions
    >;

    constructor() {
        this.#sessionManager = new SessionManager('Rewriter');
    }

    async rewrite(
        text: string,
        request?: RewriteRequest
    ): Promise<RewritingResult> {
        if (!('Rewriter' in window)) {
            return { kind: 'not-supported' };
        }

        const Rewriter = window.Rewriter;
        if (!Rewriter) {
            return { kind: 'not-supported' };
        }

        const signal = request?.signal;

        const availabilityOptions: RewriterAvailabilityOptions = {
            expectedInputLanguages: request?.config?.expectedInputLanguages ?? [
                'en',
            ],
            expectedContextLanguages: request?.config
                ?.expectedContextLanguages ??
                request?.config?.expectedInputLanguages ?? ['en'],
            outputLanguage: request?.config?.outputLanguage ?? 'en',
        };

        const availabilityResponse = await safeAvailabilityCheck(
            Rewriter,
            availabilityOptions,
            'Rewriter'
        );
        const availabilityStatus = normalizeAvailability(availabilityResponse);

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            Rewriter,
            {
                sharedContext:
                    request?.config?.sharedContext ??
                    'Rewrite webpage summaries for younger readers',
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
                    ? { monitor: createDownloadMonitor('Rewriter') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        try {
            const rewritten = await sessionResult.session.rewrite(
                text,
                request?.options ?? {}
            );

            if (signal?.aborted) {
                return { kind: 'aborted' };
            }

            return { kind: 'success', text: rewritten };
        } catch (error) {
            console.error('[Page Script] Failed to rewrite text:', error);
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
