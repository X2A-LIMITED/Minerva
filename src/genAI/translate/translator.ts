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
} from '../common.ts';

export const TRANSLATE_MODEL_RESULT_SCHEMA = createOperationResultSchema({
    text: v.string(),
});
export type TranslateResult = v.InferOutput<
    typeof TRANSLATE_MODEL_RESULT_SCHEMA
>;

export const TRANSLATE_MODEL_STREAMING_SETUP_RESULT_SCHEMA =
    createOperationResultSchema({});
export type TranslateStreamingSetupResult = v.InferOutput<
    typeof TRANSLATE_MODEL_STREAMING_SETUP_RESULT_SCHEMA
>;
export const TRANSLATE_MODEL_STREAMING_RESULT_SCHEMA =
    createOperationResultSchema({
        stream: v.any() as v.GenericSchema<AsyncIterable<string>>,
    });
export type TranslateStreamingResult = v.InferOutput<
    typeof TRANSLATE_MODEL_STREAMING_RESULT_SCHEMA
>;

export const TRANSLATE_MODEL_MESSAGE_KIND = {
    TRANSLATE: 'TRANSLATE',
    TRANSLATE_STREAMING: 'TRANSLATE_STREAMING',
    TRANSLATE_RESULT: 'TRANSLATE_RESULT',
    TRANSLATE_STREAMING_SETUP_RESULT: 'TRANSLATE_STREAMING_SETUP_RESULT',
    TRANSLATE_STREAMING_RESULT: 'TRANSLATE_STREAMING_RESULT',
} as const;

export const TRANSLATE_MODEL_MESSAGE_ROLE = {
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant',
};
export type TranslateMessageRole =
    (typeof TRANSLATE_MODEL_MESSAGE_ROLE)[keyof typeof TRANSLATE_MODEL_MESSAGE_ROLE];

export const LANGUAGE_CODE = {
    EN: 'en', // English
    FR: 'fr', // French
    ES: 'es', // Spanish
    DE: 'de', // German
    IT: 'it', // Italian
    PT: 'pt', // Portuguese
    RU: 'ru', // Russian
    ZH: 'zh', // Chinese
    JA: 'ja', // Japanese
    KO: 'ko', // Korean
    AR: 'ar', // Arabic
    HI: 'hi', // Hindi
    BN: 'bn', // Bengali
    PA: 'pa', // Punjabi
    UR: 'ur', // Urdu
    FA: 'fa', // Persian (Farsi)
    HE: 'he', // Hebrew
    TR: 'tr', // Turkish
    NL: 'nl', // Dutch
    SV: 'sv', // Swedish
    NO: 'no', // Norwegian
    DA: 'da', // Danish
    FI: 'fi', // Finnish
    EL: 'el', // Greek
    PL: 'pl', // Polish
    CS: 'cs', // Czech
    HU: 'hu', // Hungarian
    RO: 'ro', // Romanian
    TH: 'th', // Thai
    VI: 'vi', // Vietnamese
    ID: 'id', // Indonesian
    MS: 'ms', // Malay
    TL: 'tl', // Tagalog
    UK: 'uk', // Ukrainian
    SR: 'sr', // Serbian
    HR: 'hr', // Croatian
    SK: 'sk', // Slovak
    SL: 'sl', // Slovenian
    BG: 'bg', // Bulgarian
    ET: 'et', // Estonian
    LV: 'lv', // Latvian
    LT: 'lt', // Lithuanian
    IS: 'is', // Icelandic
    GA: 'ga', // Irish
    CY: 'cy', // Welsh
    SW: 'sw', // Swahili
    AF: 'af', // Afrikaans
    AM: 'am', // Amharic
    SQ: 'sq', // Albanian
    HY: 'hy', // Armenian
    KA: 'ka', // Georgian
    TA: 'ta', // Tamil
    TE: 'te', // Telugu
    ML: 'ml', // Malayalam
    KN: 'kn', // Kannada
    MR: 'mr', // Marathi
    GU: 'gu', // Gujarati
    SI: 'si', // Sinhala
    MY: 'my', // Burmese
    KM: 'km', // Khmer
    LO: 'lo', // Lao
    MN: 'mn', // Mongolian
    NE: 'ne', // Nepali
    UZ: 'uz', // Uzbek
    KK: 'kk', // Kazakh
    AZ: 'az', // Azerbaijani
    EU: 'eu', // Basque
    GL: 'gl', // Galician
    CA: 'ca', // Catalan
    EO: 'eo', // Esperanto
    LA: 'la', // Latin
} as const;

export type LanguageCode = (typeof LANGUAGE_CODE)[keyof typeof LANGUAGE_CODE];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    bn: 'Bengali',
    pa: 'Punjabi',
    ur: 'Urdu',
    fa: 'Persian',
    he: 'Hebrew',
    tr: 'Turkish',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    el: 'Greek',
    pl: 'Polish',
    cs: 'Czech',
    hu: 'Hungarian',
    ro: 'Romanian',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
    ms: 'Malay',
    tl: 'Tagalog',
    uk: 'Ukrainian',
    sr: 'Serbian',
    hr: 'Croatian',
    sk: 'Slovak',
    sl: 'Slovenian',
    bg: 'Bulgarian',
    et: 'Estonian',
    lv: 'Latvian',
    lt: 'Lithuanian',
    is: 'Icelandic',
    ga: 'Irish',
    cy: 'Welsh',
    sw: 'Swahili',
    af: 'Afrikaans',
    am: 'Amharic',
    sq: 'Albanian',
    hy: 'Armenian',
    ka: 'Georgian',
    ta: 'Tamil',
    te: 'Telugu',
    ml: 'Malayalam',
    kn: 'Kannada',
    mr: 'Marathi',
    gu: 'Gujarati',
    si: 'Sinhala',
    my: 'Burmese',
    km: 'Khmer',
    lo: 'Lao',
    mn: 'Mongolian',
    ne: 'Nepali',
    uz: 'Uzbek',
    kk: 'Kazakh',
    az: 'Azerbaijani',
    eu: 'Basque',
    gl: 'Galician',
    ca: 'Catalan',
    eo: 'Esperanto',
    la: 'Latin',
};

export const TRANSLATE_MODEL_CONFIG_SCHEMA = v.object({
    sourceLanguage: v.enum(LANGUAGE_CODE),
    targetLanguage: v.enum(LANGUAGE_CODE),
    signal: v.optional(v.instance(AbortSignal)),
    monitor: v.optional(
        v.function() as v.GenericSchema<(monitor: ModelDownloadMonitor) => void>
    ),
});

export type TranslateConfig = v.InferOutput<
    typeof TRANSLATE_MODEL_CONFIG_SCHEMA
>;

export const TRANSLATE_OPTIONS_SCHEMA = v.object({
    signal: v.optional(v.instance(AbortSignal)),
});
export type TranslateOptions = v.InferOutput<typeof TRANSLATE_OPTIONS_SCHEMA>;

export const TRANSLATE_REQUEST_SCHEMA = v.object({
    text: v.string(),
    config: TRANSLATE_MODEL_CONFIG_SCHEMA,
    options: v.optional(TRANSLATE_OPTIONS_SCHEMA),
});
export type TranslateRequest = v.InferOutput<typeof TRANSLATE_REQUEST_SCHEMA>;

export const TRANSLATE_MESSAGE_SCHEMA = v.object({
    kind: v.literal(TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE),
    requestId: v.number(),
    ...TRANSLATE_REQUEST_SCHEMA.entries,
});
export type TranslateMessage = v.InferOutput<typeof TRANSLATE_MESSAGE_SCHEMA>;
export const TRANSLATE_STREAMING_MESSAGE_SCHEMA = v.object({
    kind: v.literal(TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE_STREAMING),
    requestId: v.number(),
    ...TRANSLATE_REQUEST_SCHEMA.entries,
});
export type TranslateStreamingMessage = v.InferOutput<
    typeof TRANSLATE_STREAMING_MESSAGE_SCHEMA
>;
export const TRANSLATE_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE_RESULT),
    requestId: v.number(),
    result: TRANSLATE_MODEL_RESULT_SCHEMA,
});
export type TranslateResultMessage = v.InferOutput<
    typeof TRANSLATE_RESULT_MESSAGE_SCHEMA
>;
export const TRANSLATE_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(
        TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE_STREAMING_SETUP_RESULT
    ),
    requestId: v.number(),
    result: TRANSLATE_MODEL_STREAMING_SETUP_RESULT_SCHEMA,
});
export type TranslateStreamingSetupResultMessage = v.InferOutput<
    typeof TRANSLATE_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA
>;
export const TRANSLATE_STREAMING_RESULT_MESSAGE_SCHEMA = v.object({
    kind: v.literal(TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE_STREAMING_RESULT),
    requestId: v.number(),
    result: v.object({ text: v.string(), done: v.boolean() }),
});
export type TranslateStreamingResultMessage = v.InferOutput<
    typeof TRANSLATE_STREAMING_RESULT_MESSAGE_SCHEMA
>;
export const TRANSLATE_MODEL_MESSAGE_SCHEMA = v.variant('kind', [
    TRANSLATE_MESSAGE_SCHEMA,
    TRANSLATE_STREAMING_MESSAGE_SCHEMA,
    TRANSLATE_RESULT_MESSAGE_SCHEMA,
]);
export type TranslatorMessage = v.InferOutput<
    typeof TRANSLATE_MODEL_MESSAGE_SCHEMA
>;
export type TranslateMessageKind = TranslateMessage['kind'];

type TranslateAvailability = ModelAvailability;

type TranslateAvailabilityOptions = Omit<
    TranslateConfig,
    'monitor' | 'signal' | 'initialTranslates'
>;

type TranslateCreateOptions = TranslateConfig;

type TranslateTranslateResult = string;

type TranslateStreamChunk = string;

type TranslateStream = AsyncIterable<TranslateStreamChunk>;

type TranslateSession = SessionWithDestroy & {
    translate(
        input: string,
        options?: TranslateOptions
    ): Promise<TranslateTranslateResult>;
    translateStreaming(
        input: string,
        options?: TranslateOptions
    ): Promise<TranslateStream>;
};

type TranslateFactory = {
    availability(
        options?: TranslateAvailabilityOptions
    ): TranslateAvailability | Promise<TranslateAvailability>;
    create(options?: TranslateCreateOptions): Promise<TranslateSession>;
};

declare global {
    interface Window {
        Translator?: TranslateFactory;
    }
}

export interface CustomTranslate {
    translate(request: TranslateRequest): Promise<TranslateResult>;
    translateStreaming(
        request: TranslateRequest
    ): Promise<TranslateStreamingResult>;
}

export class ClientTranslate
    extends BaseClient<TranslateResult>
    implements CustomTranslate
{
    async translate({
        text,
        config,
        options,
    }: TranslateRequest): Promise<TranslateResult> {
        const [, result] = await this.sendRequest(
            {
                kind: TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE,
                text,
                config,
                options,
            } satisfies Omit<TranslateMessage, 'requestId'>,
            TRANSLATE_RESULT_MESSAGE_SCHEMA
        );

        return result;
    }

    async translateStreaming({
        text,
        config,
        options,
    }: TranslateRequest): Promise<TranslateStreamingResult> {
        const [requestId, setupResult] = await this.sendRequest(
            {
                kind: TRANSLATE_MODEL_MESSAGE_KIND.TRANSLATE_STREAMING,
                text,
                config,
                options,
            } satisfies Omit<TranslateStreamingMessage, 'requestId'>,
            TRANSLATE_STREAMING_SETUP_RESULT_MESSAGE_SCHEMA
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
            | ((result: TranslateStreamingResultMessage['result']) => void)
            | null = null;
        let promise = new Promise<TranslateStreamingResultMessage['result']>(
            res => {
                resolve = res;
            }
        );

        const handler = (event: MessageEvent<unknown>) => {
            const { data } = event;
            const parseResult = v.safeParse(
                TRANSLATE_STREAMING_RESULT_MESSAGE_SCHEMA,
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

export class ServerTranslate implements CustomTranslate {
    #sessionManager: SessionManager<
        TranslateSession,
        TranslateFactory,
        TranslateConfig,
        TranslateCreateOptions
    >;

    constructor() {
        this.#sessionManager = new SessionManager('Translate');
    }

    async translate({
        text,
        config,
        options,
    }: TranslateRequest): Promise<TranslateResult> {
        if (!('Translator' in window)) {
            return { kind: 'not-supported' };
        }

        const Translator = window.Translator;

        if (!Translator) {
            return { kind: 'not-supported' };
        }

        const signal = options?.signal;
        const availabilityOptions: TranslateAvailabilityOptions = {
            sourceLanguage: config.sourceLanguage,
            targetLanguage: config.targetLanguage,
        };
        let availabilityStatus: TranslateAvailability;

        try {
            const availabilityResponse =
                await Translator.availability(availabilityOptions);

            availabilityStatus = normalizeAvailability(availabilityResponse);
        } catch (error) {
            console.error(
                '[Page Script] Translate availability check failed:',
                error
            );
            availabilityStatus = 'maybe';
        }

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            Translator,
            config,
            availabilityStatus,
            (factory, options) => factory.create(options),
            (config, status) => ({
                ...config,
                signal,
                ...(requiresDownload(status)
                    ? { monitor: createDownloadMonitor('Translate') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        try {
            const response = await sessionResult.session.translate(
                text,
                options
            );

            if (signal?.aborted) {
                return { kind: 'aborted' };
            }

            if (!response) {
                return {
                    kind: 'error',
                    message: 'Translate returned empty response',
                };
            }

            return { kind: 'success', text: response };
        } catch (error) {
            console.error('[Page Script] Failed to call translate:', error);
            if (signal?.aborted) {
                return { kind: 'aborted' };
            }
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async translateStreaming({
        text,
        config,
        options,
    }: TranslateRequest): Promise<TranslateStreamingResult> {
        if (!('Translator' in window)) {
            return { kind: 'not-supported' };
        }

        const Translator = window.Translator;

        if (!Translator) {
            return { kind: 'not-supported' };
        }

        const signal = options?.signal;
        const availabilityOptions: TranslateAvailabilityOptions = {
            sourceLanguage: config?.sourceLanguage,
            targetLanguage: config?.targetLanguage,
        };
        let availabilityStatus: TranslateAvailability;

        try {
            const availabilityResponse =
                await Translator.availability(availabilityOptions);

            availabilityStatus = normalizeAvailability(availabilityResponse);
        } catch (error) {
            console.error(
                '[Page Script] Translate availability check failed:',
                error
            );
            availabilityStatus = 'maybe';
        }

        if (availabilityStatus === 'unavailable') {
            return { kind: 'no-model-available' };
        }

        const sessionResult = await this.#sessionManager.getOrCreateSession(
            Translator,
            config,
            availabilityStatus,
            (factory, options) => factory.create(options),
            (config, status) => ({
                ...config,
                signal,
                ...(requiresDownload(status)
                    ? { monitor: createDownloadMonitor('Translate') }
                    : {}),
            }),
            signal
        );

        if (sessionResult.kind !== 'success') {
            return sessionResult;
        }

        const stream = await sessionResult.session.translateStreaming(
            text,
            options
        );

        return { kind: 'success', stream };
    }

    destroy(): void {
        this.#sessionManager.destroy();
    }
}
