import * as v from 'valibot';
import {
    type ModelAvailability,
    type ModelDownloadMonitor,
    BaseClient,
    createOperationResultSchema,
    normalizeAvailability,
    createDownloadMonitor,
    requiresDownload,
    OPERATION_RESULT_KIND,
    SessionManager,
    type SessionWithDestroy,
} from './common';

export const LANGUAGE_MODEL_RESULT_SCHEMA = createOperationResultSchema({
    text: v.string(),
});
export type LanguageModelResult = v.InferOutput<
    typeof LANGUAGE_MODEL_RESULT_SCHEMA
>;

export const LANGUAGE_MODEL_STREAMING_SETUP_RESULT_SCHEMA =
    createOperationResultSchema({});
export type LanguageModelStreamingSetupResult = v.InferOutput<
    typeof LANGUAGE_MODEL_STREAMING_SETUP_RESULT_SCHEMA
>;
export const LANGUAGE_MODEL_STREAMING_RESULT_SCHEMA =
    createOperationResultSchema({
        stream: v.any() as v.GenericSchema<AsyncIterable<string>>,
    });
export type LanguageModelStreamingResult = v.InferOutput<
    typeof LANGUAGE_MODEL_STREAMING_RESULT_SCHEMA
>;

export const LANGUAGE_MODEL_MESSAGE_KIND = {
    PROMPT: 'PROMPT',
    PROMPT_STREAMING: 'PROMPT_STREAMING',
    PROMPT_RESULT: 'PROMPT_RESULT',
    PROMPT_STREAMING_SETUP_RESULT: 'PROMPT_STREAMING_SETUP_RESULT',
    PROMPT_STREAMING_RESULT: 'PROMPT_STREAMING_RESULT',
} as const;

export const LANGUAGE_MODEL_MESSAGE_ROLE = {
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant',
};
export type LanguageModelMessageRole =
    (typeof LANGUAGE_MODEL_MESSAGE_ROLE)[keyof typeof LANGUAGE_MODEL_MESSAGE_ROLE];

export const LANGUAGE_MODEL_CONFIG_SCHEMA = v.object({
    topK: v.optional(v.number()),
    temperature: v.optional(v.number()),
    expectedInputs: v.optional(
        v.array(
            v.object({
                type: v.string(),
                languages: v.array(v.string()),
            })
        )
    ),
    expectedOutputs: v.optional(
        v.array(
            v.object({
                type: v.string(),
                languages: v.array(v.string()),
            })
        )
    ),
    signal: v.optional(v.instance(AbortSignal)),
    monitor: v.optional(
        v.function() as v.GenericSchema<(monitor: ModelDownloadMonitor) => void>
    ),
    initialPrompts: v.optional(
        v.array(
            v.object({
                role: v.enum(LANGUAGE_MODEL_MESSAGE_ROLE),
                content: v.string(),
            })
        )
    ),
});
export type LanguageModelConfig = v.InferOutput<
    typeof LANGUAGE_MODEL_CONFIG_SCHEMA
>;

export const PROMPT_OPTIONS_SCHEMA = v.object({
    signal: v.optional(v.instance(AbortSignal)),
});
export type PromptOptions = v.InferOutput<typeof PROMPT_OPTIONS_SCHEMA>;

export const PROMPT_REQUEST_SCHEMA = v.object({
    text: v.string(),
    config: v.optional(LANGUAGE_MODEL_CONFIG_SCHEMA),
    options: v.optional(PROMPT_OPTIONS_SCHEMA),
});
export type PromptRequest = v.InferOutput<typeof PROMPT_REQUEST_SCHEMA>;

export const PROMPT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(LANGUAGE_MODEL_MESSAGE_KIND.PROMPT),
    requestId: v.number(),
    ...PROMPT_REQUEST_SCHEMA.entries,
});
export type PromptMessage = v.InferOutput<typeof PROMPT_MESSAGE_SCHEMA>;
export const PROMPT_STREAMING_MESSAGE_SCHEMA = v.object({
    kind: v.literal(LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING),
    requestId: v.number(),
    ...PROMPT_REQUEST_SCHEMA.entries,
});
export type PromptStreamingMessage = v.InferOutput<
    typeof PROMPT_STREAMING_MESSAGE_SCHEMA
>;
export const PROMPT_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_RESULT),
    requestId: v.number(),
    result: LANGUAGE_MODEL_RESULT_SCHEMA,
});
export type PromptResultMessage = v.InferOutput<
    typeof PROMPT_RESULT_MESSAGE_SCHEMA
>;
export const PROMPT_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_SETUP_RESULT),
    requestId: v.number(),
    result: LANGUAGE_MODEL_STREAMING_SETUP_RESULT_SCHEMA,
});
export type PromptStreamingSetupResultMessage = v.InferOutput<
    typeof PROMPT_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA
>;
export const PROMPT_STREAMING_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_RESULT),
    requestId: v.number(),
    result: v.object({ text: v.string(), done: v.boolean() }),
});
export type PromptStreamingResultMessage = v.InferOutput<
    typeof PROMPT_STREAMING_RESULT_MESSAGE_SCHEMA
>;
export const LANGUAGE_MODEL_MESSAGE_SCHEMA = v.variant('kind', [
    PROMPT_MESSAGE_SCHEMA,
    PROMPT_STREAMING_MESSAGE_SCHEMA,
    PROMPT_RESULT_MESSAGE_SCHEMA,
]);
export type LanguageModelMessage = v.InferOutput<
    typeof LANGUAGE_MODEL_MESSAGE_SCHEMA
>;
export type LanguageModelMessageKind = LanguageModelMessage['kind'];

type LanguageModelAvailability = ModelAvailability;

type LanguageModelAvailabilityOptions = Omit<
    LanguageModelConfig,
    'monitor' | 'signal' | 'initialPrompts'
>;

type LanguageModelCreateOptions = LanguageModelConfig;

type LanguageModelPromptResult = string;

type LanguageModelStreamChunk = string;

type LanguageModelStream = AsyncIterable<LanguageModelStreamChunk>;

type LanguageModelSession = SessionWithDestroy & {
    prompt(
        input: string,
        options?: PromptOptions
    ): Promise<LanguageModelPromptResult>;
    promptStreaming(
        input: string,
        options?: PromptOptions
    ): Promise<LanguageModelStream>;
};

type LanguageModelFactory = {
    availability(
        options?: LanguageModelAvailabilityOptions
    ): LanguageModelAvailability | Promise<LanguageModelAvailability>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
};

declare global {
    interface Window {
        LanguageModel?: LanguageModelFactory;
    }
}

export interface CustomLanguageModel {
    prompt(request: PromptRequest): Promise<LanguageModelResult>;
    promptStreaming(
        request: PromptRequest
    ): Promise<LanguageModelStreamingResult>;
}

export class ClientLanguageModel
    extends BaseClient<LanguageModelResult>
    implements CustomLanguageModel
{
    async prompt({
        text,
        config,
        options,
    }: PromptRequest): Promise<LanguageModelResult> {
        const [, result] = await this.sendRequest(
            {
                kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT,
                text,
                config,
                options,
            } satisfies Omit<PromptMessage, 'requestId'>,
            PROMPT_RESULT_MESSAGE_SCHEMA
        );

        return result;
    }

    async promptStreaming({
        text,
        config,
        options,
    }: PromptRequest): Promise<LanguageModelStreamingResult> {
        const [requestId, setupResult] = await this.sendRequest(
            {
                kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING,
                text,
                config,
                options,
            } satisfies Omit<PromptStreamingMessage, 'requestId'>,
            PROMPT_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA
        );

        if (setupResult.kind !== OPERATION_RESULT_KIND.SUCCESS) {
            return setupResult;
        }

        return {
            kind: OPERATION_RESULT_KIND.SUCCESS,
            stream: this.#waitStream(requestId),
        };
    }

    async *#waitStream(requestId: number) {
        let resolve:
            | ((result: PromptStreamingResultMessage['result']) => void)
            | null = null;
        let promise = new Promise<PromptStreamingResultMessage['result']>(
            res => {
                resolve = res;
            }
        );

        const handler = (event: MessageEvent<unknown>) => {
            const { data } = event;
            const parseResult = v.safeParse(
                PROMPT_STREAMING_RESULT_MESSAGE_SCHEMA,
                data
            );

            if (
                !parseResult.success ||
                (parseResult.output as any).requestId !== requestId
            ) {
                return;
            }

            if (parseResult.output.result.done) {
                window.removeEventListener('message', handler);
            }

            resolve?.(parseResult.output.result);
        };

        window.addEventListener('message', handler);

        while (true) {
            const result = await promise;

            if (result.done) {
                break;
            }

            promise = new Promise(res => (resolve = res));
            yield result.text;
        }
    }
}

export class ServerLanguageModel implements CustomLanguageModel {
    #sessionManager: SessionManager<
        LanguageModelSession,
        LanguageModelFactory,
        LanguageModelConfig,
        LanguageModelCreateOptions
    >;

    constructor() {
        this.#sessionManager = new SessionManager('LanguageModel');
    }

    async prompt({
        text,
        config,
        options,
    }: PromptRequest): Promise<LanguageModelResult> {
        if (!('LanguageModel' in window)) {
            return { kind: 'not-supported' };
        }

        const LanguageModel = window.LanguageModel;

        if (!LanguageModel) {
            return { kind: 'not-supported' };
        }

        const signal = options?.signal;
        const defaultExpectedOutputs = [{ type: 'text', languages: ['en'] }];
        const availabilityOptions: LanguageModelAvailabilityOptions = {
            topK: config?.topK,
            temperature: config?.temperature,
            expectedInputs: config?.expectedInputs,
            expectedOutputs: config?.expectedOutputs ?? defaultExpectedOutputs,
        };
        let availabilityStatus: LanguageModelAvailability;

        try {
            const availabilityResponse =
                await LanguageModel.availability(availabilityOptions);

            availabilityStatus = normalizeAvailability(availabilityResponse);
        } catch (error) {
            console.error(
                '[Page Script] LanguageModel availability check failed:',
                error
            );
            availabilityStatus = 'maybe';
        }

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            LanguageModel,
            {
                ...availabilityOptions,
                initialPrompts: config?.initialPrompts,
            } as LanguageModelConfig,
            availabilityStatus,
            (factory, options) => factory.create(options),
            (config, status) => ({
                ...config,
                signal,
                ...(requiresDownload(status)
                    ? { monitor: createDownloadMonitor('LanguageModel') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        try {
            const response = await sessionResult.session.prompt(text, options);

            if (signal?.aborted) {
                return { kind: 'aborted' };
            }

            if (!response) {
                return {
                    kind: 'error',
                    message: 'LanguageModel returned empty response',
                };
            }

            return { kind: 'success', text: response };
        } catch (error) {
            console.error(
                '[Page Script] Failed to prompt language model:',
                error
            );
            if (signal?.aborted) {
                return { kind: 'aborted' };
            }
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async promptStreaming({
        text,
        config,
        options,
    }: PromptRequest): Promise<LanguageModelStreamingResult> {
        if (!('LanguageModel' in window)) {
            return { kind: 'not-supported' };
        }

        const LanguageModel = window.LanguageModel;

        if (!LanguageModel) {
            return { kind: 'not-supported' };
        }

        const signal = options?.signal;
        const defaultExpectedOutputs = [{ type: 'text', languages: ['en'] }];
        const availabilityOptions: LanguageModelAvailabilityOptions = {
            topK: config?.topK,
            temperature: config?.temperature,
            expectedInputs: config?.expectedInputs,
            expectedOutputs: config?.expectedOutputs ?? defaultExpectedOutputs,
        };
        let availabilityStatus: LanguageModelAvailability;

        try {
            const availabilityResponse =
                await LanguageModel.availability(availabilityOptions);

            availabilityStatus = normalizeAvailability(availabilityResponse);
        } catch (error) {
            console.error(
                '[Page Script] LanguageModel availability check failed:',
                error
            );
            availabilityStatus = 'maybe';
        }

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            LanguageModel,
            {
                ...availabilityOptions,
                initialPrompts: config?.initialPrompts,
            } as LanguageModelConfig,
            availabilityStatus,
            (factory, options) => factory.create(options),
            (config, status) => ({
                ...config,
                signal,
                ...(requiresDownload(status)
                    ? { monitor: createDownloadMonitor('LanguageModel') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        const stream = await sessionResult.session.promptStreaming(
            text,
            options
        );

        return { kind: 'success', stream };
    }

    destroy(): void {
        this.#sessionManager.destroy();
    }
}
