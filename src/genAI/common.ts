import * as v from 'valibot';

export const OPERATION_RESULT_KIND = {
    SUCCESS: 'success',
    NOT_SUPPORTED: 'not-supported',
    NO_MODEL_AVAILABLE: 'no-model-available',
    ABORTED: 'aborted',
    ERROR: 'error',
} as const;

export function createOperationResultSchema<TData extends v.ObjectEntries>(
    successBaseSchema: TData
) {
    return v.variant('kind', [
        v.object({
            kind: v.literal(OPERATION_RESULT_KIND.SUCCESS),
            ...successBaseSchema,
        }),
        v.object({ kind: v.literal(OPERATION_RESULT_KIND.NOT_SUPPORTED) }),
        v.object({ kind: v.literal(OPERATION_RESULT_KIND.NO_MODEL_AVAILABLE) }),
        v.object({ kind: v.literal(OPERATION_RESULT_KIND.ABORTED) }),
        v.object({
            kind: v.literal(OPERATION_RESULT_KIND.ERROR),
            message: v.string(),
        }),
    ]);
}

export const MODEL_AVAILABILITY = {
    AVAILABLE: 'available',
    DOWNLOADABLE: 'downloadable',
    DOWNLOADING: 'downloading',
    UNAVAILABLE: 'unavailable',
    MAYBE: 'maybe',
} as const;
export type ModelAvailability =
    (typeof MODEL_AVAILABILITY)[keyof typeof MODEL_AVAILABILITY];
export const MODEL_AVAILABILITY_SCHEMA = v.enum(MODEL_AVAILABILITY);

export type OperationResult<TData extends v.ObjectEntries> = v.InferOutput<
    ReturnType<typeof createOperationResultSchema<TData>>
>;

export interface BaseModelConfig {
    sharedContext?: string;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
    expectedOutputs?: Array<{ type: string; languages: string[] }>;
    tone?: string;

    sourceLanguage?: string;
    targetLanguage?: string;
}

export interface BaseRequestOptions {
    signal?: AbortSignal;
}

export interface ModelDownloadMonitor {
    addEventListener(
        type: 'downloadprogress',
        listener: (event: ModelDownloadProgressEvent) => void
    ): void;
}

export interface ModelDownloadProgressEvent {
    loaded: number;
}

export interface BaseCreateOptions extends BaseModelConfig {
    signal?: AbortSignal;
    monitor?: (monitor: ModelDownloadMonitor) => void;
}
export async function safeAvailabilityCheck<
    TOptions,
    TAvailability extends ModelAvailability,
>(
    factory: {
        availability(
            options?: TOptions
        ): TAvailability | Promise<TAvailability>;
    },
    options: TOptions,
    modelName: string
): Promise<TAvailability> {
    try {
        const availability = factory.availability(options);
        if (availability instanceof Promise) {
            return availability.catch(error => {
                console.error(
                    `[Page Script] ${modelName} availability check failed:`,
                    error
                );
                return 'maybe' as TAvailability;
            });
        }
        return Promise.resolve(availability);
    } catch (error) {
        console.error(
            `[Page Script] ${modelName} availability threw synchronously:`,
            error
        );
        return Promise.resolve('maybe' as TAvailability);
    }
}

export function normalizeAvailability(
    availability:
        | ModelAvailability
        | { type?: ModelAvailability }
        | null
        | undefined
): ModelAvailability {
    if (typeof availability === 'string') {
        return availability;
    }

    const type = availability?.type;

    if (typeof type === 'string') {
        return type;
    }

    return 'maybe';
}

export function getConfigKey(options: BaseModelConfig): string {
    return JSON.stringify({
        sharedContext: options.sharedContext ?? null,
        expectedInputLanguages: options.expectedInputLanguages ?? [],
        expectedContextLanguages: options.expectedContextLanguages ?? [],
        outputLanguage: options.outputLanguage ?? null,
        tone: options.tone ?? null,
        sourceLanguage: options.sourceLanguage ?? null,
        targetLanguage: options.targetLanguage ?? null,
    });
}

export function createDownloadMonitor(
    modelName: string,
    callback?: (monitor: ModelDownloadMonitor) => void
) {
    return function monitor(monitor: ModelDownloadMonitor) {
        console.log(`[Page Script] ${modelName} monitor callback registered`);
        monitor.addEventListener(
            'downloadprogress',
            (event: ModelDownloadProgressEvent) => {
                console.log(
                    `[Page Script] ${modelName} download progress:`,
                    event.loaded
                );
            }
        );

        callback?.(monitor);
    };
}

export function requiresDownload(status: ModelAvailability): boolean {
    return status === 'downloadable' || status === 'downloading';
}

export class BaseClient<TResult> {
    #requestId: number;

    constructor() {
        this.#requestId = 0;
    }

    protected async sendRequest<TMessage>(
        message: TMessage,
        resultSchema: v.BaseSchema<any, any, any>
    ): Promise<[number, TResult]> {
        const requestId = ++this.#requestId;
        const messageWithId = { ...message, requestId };

        window.postMessage(messageWithId);
        return [requestId, await this.#waitResult(requestId, resultSchema)];
    }

    #waitResult(
        requestId: number,
        resultSchema: v.BaseSchema<any, any, any>
    ): Promise<TResult> {
        return new Promise(resolve => {
            const handler = (event: MessageEvent<unknown>) => {
                const { data } = event;
                const parseResult = v.safeParse(resultSchema, data);

                if (
                    !parseResult.success ||
                    (parseResult.output as any).requestId !== requestId
                ) {
                    return;
                }

                window.removeEventListener('message', handler);
                resolve((parseResult.output as any).result);
            };

            window.addEventListener('message', handler);
        });
    }
}

export abstract class BaseServer<
    TInstance,
    TFactory,
    TConfig extends BaseModelConfig,
    TResult extends OperationResult<any>,
> {
    #instance: TInstance | null;
    #configKey: string | null;

    protected abstract readonly modelName: string;
    protected abstract readonly windowProperty: keyof Window;
    protected abstract readonly defaultSharedContext: string;

    constructor() {
        this.#instance = null;
        this.#configKey = null;
    }

    protected abstract getFactory(): TFactory | undefined;

    protected abstract checkAvailability(
        factory: TFactory,
        config: TConfig,
        signal?: AbortSignal
    ): Promise<ModelAvailability>;

    protected abstract createInstance(
        factory: TFactory,
        config: TConfig,
        availabilityStatus: ModelAvailability,
        signal?: AbortSignal
    ): Promise<TInstance>;

    protected abstract executeOperation(
        instance: TInstance,
        signal?: AbortSignal,
        ...args: any[]
    ): Promise<string>;

    protected abstract formatSuccessResult(data: string): TResult;

    protected async execute(
        config: TConfig,
        signal?: AbortSignal,
        ...operationArgs: any[]
    ): Promise<TResult> {
        if (!(this.windowProperty in window)) {
            return { kind: 'not-supported' } as TResult;
        }

        const factory = this.getFactory();
        if (!factory) {
            return { kind: 'not-supported' } as TResult;
        }

        const availabilityStatus = await this.checkAvailability(
            factory,
            config,
            signal
        );

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' } as TResult;
        }

        const nextConfigKey = getConfigKey(config);

        if (!this.#instance || this.#configKey !== nextConfigKey) {
            try {
                this.#instance = await this.createInstance(
                    factory,
                    config,
                    availabilityStatus,
                    signal
                );
                this.#configKey = nextConfigKey;
            } catch (error) {
                console.error(
                    `[Page Script] Failed to create ${this.modelName} instance:`,
                    error
                );
                if (signal?.aborted) {
                    return { kind: 'aborted' } as TResult;
                }
                return {
                    kind: 'error',
                    message:
                        error instanceof Error ? error.message : String(error),
                } as TResult;
            }
        }

        if (!this.#instance) {
            return {
                kind: 'error',
                message: `${this.modelName} instance unavailable`,
            } as TResult;
        }

        try {
            const result = await this.executeOperation(
                this.#instance,
                signal,
                ...operationArgs
            );

            if (signal?.aborted) {
                return { kind: 'aborted' } as TResult;
            }

            return this.formatSuccessResult(result);
        } catch (error) {
            console.error(
                `[Page Script] Failed to execute ${this.modelName} operation:`,
                error
            );
            if (signal?.aborted) {
                return { kind: 'aborted' } as TResult;
            }
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error),
            } as TResult;
        }
    }

    protected buildAvailabilityOptions(config: TConfig) {
        return {
            expectedInputLanguages: config.expectedInputLanguages ?? ['en'],
            expectedContextLanguages: config.expectedContextLanguages ??
                config.expectedInputLanguages ?? ['en'],
            outputLanguage: config.outputLanguage ?? 'en',
        };
    }

    protected buildCreateOptions(
        config: TConfig,
        availabilityOptions: any,
        availabilityStatus: ModelAvailability,
        signal?: AbortSignal
    ): BaseCreateOptions {
        return {
            sharedContext: config.sharedContext ?? this.defaultSharedContext,
            expectedInputLanguages: availabilityOptions.expectedInputLanguages,
            expectedContextLanguages:
                availabilityOptions.expectedContextLanguages,
            outputLanguage: availabilityOptions.outputLanguage,
            tone: config.tone,
            signal,
            ...(requiresDownload(availabilityStatus)
                ? { monitor: createDownloadMonitor(this.modelName) }
                : {}),
        };
    }
}

export interface SessionWithDestroy {
    destroy?(): void;
}

export class SessionManager<
    TSession extends SessionWithDestroy,
    TFactory,
    TConfig extends BaseModelConfig,
    TCreateOptions,
> {
    #session: TSession | null = null;
    #configKey: string | null = null;
    #modelName: string;

    constructor(modelName: string) {
        this.#modelName = modelName;
    }

    async getOrCreateSession(
        factory: TFactory,
        config: TConfig,
        availabilityStatus: ModelAvailability,
        createFn: (
            factory: TFactory,
            options: TCreateOptions
        ) => Promise<TSession>,
        buildOptions: (
            config: TConfig,
            status: ModelAvailability
        ) => TCreateOptions,
        signal?: AbortSignal
    ): Promise<
        | { kind: 'success'; session: TSession }
        | { kind: 'aborted' }
        | {
              kind: 'error';
              message: string;
          }
    > {
        const createOptions = buildOptions(config, availabilityStatus);
        const nextConfigKey = getConfigKey(config);

        if (!this.#session || this.#configKey !== nextConfigKey) {
            if (this.#session && typeof this.#session.destroy === 'function') {
                try {
                    this.#session.destroy();
                } catch (error) {
                    console.warn(
                        `[Page Script] Failed to destroy old ${this.#modelName} session:`,
                        error
                    );
                }
            }

            try {
                this.#session = await createFn(factory, createOptions);
                this.#configKey = nextConfigKey;
            } catch (error) {
                console.error(
                    `[Page Script] Failed to create ${this.#modelName} session:`,
                    error
                );
                if (signal?.aborted) {
                    return { kind: 'aborted' };
                }
                return {
                    kind: 'error',
                    message:
                        error instanceof Error ? error.message : String(error),
                };
            }
        }

        if (!this.#session) {
            return {
                kind: 'error',
                message: `${this.#modelName} session unavailable`,
            };
        }

        return { kind: 'success', session: this.#session };
    }

    destroy(): void {
        if (this.#session && typeof this.#session.destroy === 'function') {
            try {
                this.#session.destroy();
            } catch (error) {
                console.warn(
                    `[Page Script] Failed to destroy ${this.#modelName} session:`,
                    error
                );
            }
        }
        this.#session = null;
        this.#configKey = null;
    }
}
