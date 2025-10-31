/**
 * useSummaryManager Hook
 *
 * Manages summary state, caching, and regeneration.
 * Replaces summary management logic from InlineSummaryController.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    SUMMARY_LENGTH,
    SUMMARY_TYPE,
    type CustomSummarizer,
    type SummaryLength,
    type SummaryType,
} from '../genAI/summarizer/summarizeAPI';

export interface UseSummaryManagerOptions {
    summarizer: CustomSummarizer;
    originalText: string;
    initialType?: SummaryType;
    initialLength?: SummaryLength;
}

export interface UseSummaryManagerReturn {
    currentSummary: string;
    currentType: SummaryType;
    currentLength: SummaryLength;
    isLoading: boolean;
    error: string | null;
    handleTypeChange: (type: SummaryType) => Promise<void>;
    handleLengthChange: (length: SummaryLength) => Promise<void>;
}

function getCacheKey(
    text: string,
    type: SummaryType,
    length: SummaryLength
): string {
    return `${text.substring(0, 100)}|${type}|${length}`;
}

export function useSummaryManager({
    summarizer,
    originalText,
    initialType = SUMMARY_TYPE.TLDR,
    initialLength = SUMMARY_LENGTH.MEDIUM,
}: UseSummaryManagerOptions): UseSummaryManagerReturn {
    const [summaryCache, setSummaryCache] = useState<Map<string, string>>(
        new Map()
    );
    const [currentType, setCurrentType] = useState<SummaryType>(initialType);
    const [currentLength, setCurrentLength] =
        useState<SummaryLength>(initialLength);
    const [currentSummary, setCurrentSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = useCallback(
        async (type: SummaryType, length: SummaryLength) => {
            const cacheKey = getCacheKey(originalText, type, length);
            const cached = summaryCache.get(cacheKey);
            if (cached) {
                setCurrentSummary(cached);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await summarizer.summarize({
                    text: originalText,
                    config: {
                        type,
                        length,
                    },
                });

                if (result.kind === 'success' && result.summary) {
                    const summary = result.summary;
                    setCurrentSummary(summary);

                    setSummaryCache(prev => {
                        const newCache = new Map(prev);
                        newCache.set(cacheKey, summary);
                        return newCache;
                    });
                } else {
                    const errorMsg = 'Summarization failed';
                    console.error('[useSummaryManager]', errorMsg, result);
                    setError(errorMsg);
                }
            } catch (err) {
                const errorMsg =
                    err instanceof Error ? err.message : 'An error occurred';
                console.error('[useSummaryManager] Error:', err);
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        },
        [summarizer, originalText, summaryCache]
    );

    useEffect(() => {
        generateSummary(currentType, currentLength);
    }, []); // Only run on mount

    const handleTypeChange = async (type: SummaryType) => {
        setCurrentType(type);
        await generateSummary(type, currentLength);
    };

    const handleLengthChange = async (length: SummaryLength) => {
        setCurrentLength(length);
        await generateSummary(currentType, length);
    };

    return {
        currentSummary,
        currentType,
        currentLength,
        isLoading,
        error,
        handleTypeChange,
        handleLengthChange,
    };
}
