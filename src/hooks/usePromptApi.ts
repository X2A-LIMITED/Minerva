import { useState } from 'react';
import type { CustomLanguageModel } from '../genAI/languageModel';
import { OPERATION_RESULT_KIND } from '../genAI/common';

export type PromptHistoryEntry = {
    question: string;
    answer: string;
};

export interface UsePromptApiOptions {
    languageModel: CustomLanguageModel;
    context: string;
    allowEmptyContext?: boolean;
}

export interface UsePromptApiReturn {
    history: PromptHistoryEntry[];
    currentIndex: number;
    isLoading: boolean;
    submitQuestion: (question: string) => Promise<void>;
    navigatePrevious: () => void;
    navigateNext: () => void;
    copyAnswer: () => Promise<void>;
}

const MAX_CONTEXT_LENGTH = 8000;

export function usePromptApi({
    languageModel,
    context,
    allowEmptyContext = false,
}: UsePromptApiOptions): UsePromptApiReturn {
    const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const submitQuestion = async (question: string) => {
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion) {
            return;
        }

        if (isLoading) {
            return;
        }

        const sanitizedContext = context.trim();

        if (
            !allowEmptyContext &&
            (!sanitizedContext || sanitizedContext === '[object Object]')
        ) {
            setHistory(prev => [
                ...prev,
                {
                    question: trimmedQuestion,
                    answer: 'Original content unavailable for this selection.',
                },
            ]);
            setCurrentIndex(history.length);
            return;
        }

        setIsLoading(true);

        const newEntry: PromptHistoryEntry = {
            question: trimmedQuestion,
            answer: 'Checking Language Model availability...',
        };

        setHistory(prev => [...prev, newEntry]);
        const newIndex = history.length;
        setCurrentIndex(newIndex);

        try {
            let promptText: string;
            if (allowEmptyContext) {
                promptText = trimmedQuestion;
            } else {
                const truncatedContext =
                    sanitizedContext.length > MAX_CONTEXT_LENGTH
                        ? sanitizedContext.slice(0, MAX_CONTEXT_LENGTH)
                        : sanitizedContext;
                promptText = `Question: ${trimmedQuestion}\n\nSource text:\n${truncatedContext}`;
            }

            console.log('[usePromptApi] Calling promptStreaming');

            const result = await languageModel.promptStreaming({
                text: promptText,
                config: {
                    temperature: 0.7,
                    topK: 40,
                },
            });

            if (result.kind !== OPERATION_RESULT_KIND.SUCCESS) {
                let errorMessage = 'Failed to generate answer';

                if (result.kind === 'not-supported') {
                    errorMessage =
                        'Language Model API not supported in this browser';
                } else if (result.kind === 'no-model-available') {
                    errorMessage = 'Language Model not available';
                } else if (result.kind === 'error' && 'message' in result) {
                    errorMessage = result.message;
                } else if (result.kind === 'aborted') {
                    errorMessage = 'Request was aborted';
                }

                setHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer = errorMessage;
                    return updated;
                });
                setIsLoading(false);
                return;
            }

            setHistory(prev => {
                const updated = [...prev];
                updated[newIndex].answer = 'Generating answer...';
                return updated;
            });

            let aggregatedAnswer = '';
            for await (const chunk of result.stream) {
                aggregatedAnswer += chunk;
                setHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer = aggregatedAnswer;
                    return updated;
                });
            }

            if (!aggregatedAnswer.trim()) {
                setHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer =
                        'Language Model returned no answer.';
                    return updated;
                });
            }
        } catch (error) {
            console.error('[usePromptApi] Error:', error);
            setHistory(prev => {
                const updated = [...prev];
                updated[newIndex].answer =
                    error instanceof Error
                        ? error.message
                        : 'An error occurred';
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const navigatePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const navigateNext = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const copyAnswer = async () => {
        const entry = history[currentIndex];
        if (entry?.answer) {
            try {
                await navigator.clipboard.writeText(entry.answer);
            } catch (error) {
                console.error('[usePromptApi] Failed to copy answer:', error);
            }
        }
    };

    return {
        history,
        currentIndex,
        isLoading,
        submitQuestion,
        navigatePrevious,
        navigateNext,
        copyAnswer,
    };
}
