import { useState } from 'react';
import type { CustomLanguageModel } from '../genAI/languageModel';

export interface PromptHistoryEntry {
    question: string;
    answer: string;
}

export interface UsePromptHistoryOptions {
    languageModel: CustomLanguageModel;
    originalText: string;
}

export interface UsePromptHistoryReturn {
    promptHistory: PromptHistoryEntry[];
    currentIndex: number;
    isLoading: boolean;
    submitQuestion: (question: string) => Promise<void>;
    navigatePrevious: () => void;
    navigateNext: () => void;
    copyAnswer: () => Promise<void>;
}

export function usePromptHistory({
    languageModel,
    originalText,
}: UsePromptHistoryOptions): UsePromptHistoryReturn {
    const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>(
        []
    );
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const submitQuestion = async (question: string) => {
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion) return;
        if (isLoading) return;

        const sanitizedContext = originalText.trim();

        if (!sanitizedContext) {
            setPromptHistory(prev => [
                ...prev,
                {
                    question: trimmedQuestion,
                    answer: 'Original content unavailable for this selection.',
                },
            ]);
            setCurrentIndex(promptHistory.length);
            return;
        }

        setIsLoading(true);

        const newEntry: PromptHistoryEntry = {
            question: trimmedQuestion,
            answer: 'Checking Language Model availability...',
        };

        setPromptHistory(prev => [...prev, newEntry]);
        const newIndex = promptHistory.length;
        setCurrentIndex(newIndex);

        try {
            const setupResult = await languageModel.promptStreaming({
                text: `Question: ${trimmedQuestion}\n\nSource text:\n${sanitizedContext}`,
            });

            if (setupResult.kind !== 'success') {
                console.error('[usePromptHistory] Setup failed:', setupResult);
                setPromptHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer =
                        'Error: Language model not available';
                    return updated;
                });
                setIsLoading(false);
                return;
            }

            let fullText = '';
            for await (const chunk of setupResult.stream) {
                fullText += chunk;
                setPromptHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer = fullText;
                    return updated;
                });
            }

            if (!fullText.trim()) {
                setPromptHistory(prev => {
                    const updated = [...prev];
                    updated[newIndex].answer = 'No response received.';
                    return updated;
                });
            }
        } catch (error) {
            console.error('[usePromptHistory] Streaming error:', error);
            setPromptHistory(prev => {
                const updated = [...prev];
                updated[newIndex].answer =
                    error instanceof Error
                        ? error.message
                        : 'Error: Streaming failed';
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
        if (currentIndex < promptHistory.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const copyAnswer = async () => {
        const entry = promptHistory[currentIndex];
        if (entry?.answer) {
            try {
                await navigator.clipboard.writeText(entry.answer);
            } catch (error) {
                console.error(
                    '[usePromptHistory] Failed to copy answer:',
                    error
                );
            }
        }
    };

    return {
        promptHistory,
        currentIndex,
        isLoading,
        submitQuestion,
        navigatePrevious,
        navigateNext,
        copyAnswer,
    };
}
