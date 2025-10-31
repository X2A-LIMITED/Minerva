import {
    ServerSummarizer,
    SUMMARIZER_MESSAGE_KIND,
    SUMMARIZER_MESSAGE_SCHEMA,
    type SummarizeResultMessage,
} from './genAI/summarizer/summarizeAPI.ts';
import {
    ServerRewriter,
    REWRITER_MESSAGE_KIND,
    REWRITER_MESSAGE_SCHEMA,
    type RewriteResultMessage,
} from './genAI/textGenerator/rewriter.ts';
import * as v from 'valibot';
import {
    LANGUAGE_MODEL_MESSAGE_KIND,
    PROMPT_MESSAGE_SCHEMA,
    PROMPT_STREAMING_MESSAGE_SCHEMA,
    ServerLanguageModel,
    type PromptStreamingResultMessage,
    type PromptStreamingSetupResultMessage,
} from './genAI/languageModel.ts';
import { OPERATION_RESULT_KIND } from './genAI/common.ts';

const languageModel = new ServerLanguageModel();
const summarizer = new ServerSummarizer();
const rewriter = new ServerRewriter();

const MESSAGE_SCHEMA = v.variant('kind', [
    SUMMARIZER_MESSAGE_SCHEMA,
    PROMPT_MESSAGE_SCHEMA,
    PROMPT_STREAMING_MESSAGE_SCHEMA,
    REWRITER_MESSAGE_SCHEMA,
]);

window.addEventListener('message', async (message: MessageEvent<unknown>) => {
    const { data } = message;

    const parseResult = v.safeParse(MESSAGE_SCHEMA, data);

    if (!parseResult.success) {
        return;
    }

    const parsedMessage = parseResult.output;

    switch (parsedMessage.kind) {
        case SUMMARIZER_MESSAGE_KIND.SUMMARIZE_CONTENT: {
            const { requestId, text, config, options } = parsedMessage;
            const result = await summarizer.summarize({
                text,
                config,
                options,
            });

            window.postMessage({
                kind: SUMMARIZER_MESSAGE_KIND.SUMMARIZE_RESULT,
                requestId,
                result,
            } satisfies SummarizeResultMessage);
            break;
        }
        case LANGUAGE_MODEL_MESSAGE_KIND.PROMPT: {
            const { requestId, text, config, options } = parsedMessage;
            const result = await languageModel.prompt({
                text,
                config,
                options,
            });

            window.postMessage({
                kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_RESULT,
                requestId,
                result,
            });
            break;
        }
        case LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING: {
            const { requestId, text, config, options } = parsedMessage;
            const setupResult = await languageModel.promptStreaming({
                text,
                config,
                options,
            });

            if (setupResult.kind !== OPERATION_RESULT_KIND.SUCCESS) {
                window.postMessage({
                    kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_SETUP_RESULT,
                    requestId,
                    result: setupResult,
                } satisfies PromptStreamingSetupResultMessage);
                return;
            }

            window.postMessage({
                kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_SETUP_RESULT,
                requestId,
                result: { kind: OPERATION_RESULT_KIND.SUCCESS },
            } satisfies PromptStreamingSetupResultMessage);

            for await (const text of setupResult.stream) {
                window.postMessage({
                    kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_RESULT,
                    requestId,
                    result: { text, done: false },
                } satisfies PromptStreamingResultMessage);
            }

            window.postMessage({
                kind: LANGUAGE_MODEL_MESSAGE_KIND.PROMPT_STREAMING_RESULT,
                requestId,
                result: { text: '', done: true },
            } satisfies PromptStreamingResultMessage);
            break;
        }
        case REWRITER_MESSAGE_KIND.REWRITE_TEXT: {
            const { requestId, text, request } = parsedMessage;
            const result = await rewriter.rewrite(text, request);

            window.postMessage({
                kind: REWRITER_MESSAGE_KIND.REWRITE_RESULT,
                requestId,
                result,
            } satisfies RewriteResultMessage);
            break;
        }
    }
});
