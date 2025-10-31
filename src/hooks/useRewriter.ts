/**
 * useRewriter Hook
 *
 * Manages rewriter state and child-friendly text generation.
 * Replaces rewrite logic from InlineSummaryController.
 */

import { useCallback, useState } from 'react';
import type {
    CustomRewriter,
    RewriteRequest,
    RewritingResult,
} from '../genAI/textGenerator/rewriter.ts';
import type { SummaryLength, SummaryType } from '../ui/index.ts';
import {
    SUMMARY_LENGTH,
    SUMMARY_TYPE,
} from '../genAI/summarizer/summarizeAPI.ts';

export type RewriteMode = 'summary' | 'child';
export type RewriteStatusText =
    | RewritingResult['kind']
    | 'loading'
    | 'empty'
    | '';

export interface UseRewriterOptions {
    rewriter: CustomRewriter;
    originalText: string;
    summaryType?: SummaryType;
    summaryLength?: SummaryLength;
}

export interface UseRewriterReturn {
    statusText: RewriteStatusText;
    isRewriting: boolean;
    isDisabled: boolean;
    handleRewrite: () => Promise<boolean>;
    childFriendlySummary: string;
    clearStatusText: () => void;
}

export function useRewriter({
    rewriter,
    originalText,
    summaryType = SUMMARY_TYPE.TLDR,
    summaryLength = SUMMARY_LENGTH.MEDIUM,
}: UseRewriterOptions): UseRewriterReturn {
    const [cachedSummary, setCachedSummary] = useState<Map<string, string>>(
        new Map()
    );
    const [childFriendlySummary, setChildFriendlySummary] =
        useState<string>('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [statusText, setStatusText] = useState<RewriteStatusText>('');
    const [isDisabled, setIsDisabled] = useState(false);
    const handleRewrite = useCallback(async (): Promise<boolean> => {
        const cacheKey = getCacheKey(originalText, summaryType, summaryLength);

        if (isRewriting) {
            return false;
        }

        const cached = cachedSummary.get(cacheKey);

        if (cached) {
            setStatusText('success');
            setChildFriendlySummary(cached);
            return true;
        }

        setIsRewriting(true);
        setStatusText('loading');

        const rewriteRequest: RewriteRequest = {
            config: {
                sharedContext:
                    'Rewrite webpage summaries so they are accessible to younger readers.',
                expectedInputLanguages: ['en'],
                expectedContextLanguages: ['en'],
                outputLanguage: 'en',
                tone: 'more-casual',
            },
            options: {
                context:
                    'Explain this summary as if you were talking to a young child. Use simple words, short sentences, and keep the important facts accurate.',
                tone: 'more-casual',
            },
        };

        try {
            const result = await rewriter.rewrite(originalText, rewriteRequest);

            setIsRewriting(false);

            if (result.kind === 'success') {
                const normalized = result.text.trim();
                if (!normalized) {
                    setStatusText('empty');
                    return false;
                }

                setChildFriendlySummary(normalized);
                setCachedSummary(prev => {
                    const newCache = new Map(prev);

                    newCache.set(cacheKey, normalized);
                    return newCache;
                });
                setStatusText('success');
                return true;
            }

            if (result.kind === 'not-supported') {
                setIsDisabled(true);
            }

            setStatusText(result.kind);
            return false;
        } catch (error) {
            console.error('[useRewriter] Error:', error);
            setIsRewriting(false);
            setStatusText('error');
            return false;
        }
    }, [
        rewriter,
        isRewriting,
        childFriendlySummary,
        cachedSummary,
        summaryType,
        summaryLength,
        originalText,
    ]);
    const clearStatusText = useCallback(() => {
        setStatusText('');
    }, []);

    return {
        statusText,
        isRewriting,
        isDisabled,
        handleRewrite,
        childFriendlySummary,
        clearStatusText,
    };
}

function getCacheKey(
    text: string,
    type: SummaryType,
    length: SummaryLength
): string {
    return `${text.substring(0, 100)}|${type}|${length}`;
}
