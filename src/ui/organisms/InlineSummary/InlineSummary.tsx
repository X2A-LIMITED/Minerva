import { CopyButton, UndoButton } from '../../atoms';
import { SummaryTextWithLinks, ToggleGroup } from '../../molecules';
import type { LinkMapping } from '../../molecules/SummaryTextWithLinks';
import { RewriteControls, Prompt } from '../../molecules';
import { useSummaryManager, useRewriter } from '../../../hooks';

import type { CustomLanguageModel } from '../../../genAI/languageModel';
import {
    type CustomSummarizer,
    type SummaryLength,
    type SummaryType,
} from '../../../genAI/summarizer/summarizeAPI.ts';
import type { CustomRewriter } from '../../../genAI/textGenerator/rewriter.ts';
import styles from './InlineSummary.module.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadAloudButton } from '../../atoms/ReadAloudButton/ReadAloudButton.tsx';
import { SettingsContext, useContextNotNull } from '../../../contexts/index.ts';

export type { SummaryType, SummaryLength };

export interface InlineSummaryProps {
    originalText: string;
    summarizer: CustomSummarizer;
    rewriter: CustomRewriter;
    languageModel: CustomLanguageModel;
    links?: LinkMapping[];
    onCopySummary?: (summary: string) => void;
    onUndo?: () => void;
    initialType?: SummaryType;
    initialLength?: SummaryLength;
    showPromptControls?: boolean;
    showRewriteControls?: boolean;
    requestApiKey: () => void;
    onSummaryComplete?: () => void;
}

export const InlineSummary: React.FC<InlineSummaryProps> = ({
    originalText,
    summarizer,
    rewriter,
    languageModel,
    links = [],
    onCopySummary,
    onUndo,
    showPromptControls = false,
    showRewriteControls = false,
    requestApiKey,
    onSummaryComplete,
}) => {
    const [rewriteMode, setRewriteMode] = useState<'summary' | 'child'>(
        'summary'
    );
    const settings = useContextNotNull(SettingsContext);
    const {
        currentSummary,
        currentType,
        currentLength,
        handleTypeChange,
        handleLengthChange,
        isLoading: isSummarizing,
    } = useSummaryManager({
        summarizer,
        originalText,
        initialType: settings.summaryType,
        initialLength: settings.summaryLength,
    });
    const {
        statusText: rewriteStatusText,
        isRewriting,
        isDisabled: rewriteDisabled,
        handleRewrite,
        childFriendlySummary,
        clearStatusText,
    } = useRewriter({
        rewriter,
        originalText: currentSummary,
        summaryType: settings.summaryType,
        summaryLength: settings.summaryLength,
    });
    const displayText = useMemo(() => {
        if (rewriteMode === 'summary') {
            return currentSummary || originalText;
        }

        return childFriendlySummary || currentSummary || originalText;
    }, [rewriteMode, currentSummary, childFriendlySummary]);
    const buttonText = useMemo(() => {
        if (isRewriting) {
            return 'Rewriting...';
        }

        return rewriteMode === 'summary' ? 'Explain for kids' : 'Show original';
    }, [isRewriting, rewriteMode]);
    const onRewrite = useCallback(async () => {
        if (rewriteMode === 'child') {
            clearStatusText();
            setRewriteMode('summary');
            return;
        }

        const success = await handleRewrite();

        if (success) {
            setRewriteMode('child');
        }
    }, [rewriteMode, handleRewrite]);
    const handleCopySummary = useCallback(() => {
        onCopySummary?.(displayText);
    }, [onCopySummary, displayText]);

    const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);
    useEffect(() => {
        if (!isSummarizing && currentSummary && !hasNotifiedCompletion) {
            setHasNotifiedCompletion(true);
            onSummaryComplete?.();
        }
    }, [
        isSummarizing,
        currentSummary,
        hasNotifiedCompletion,
        onSummaryComplete,
    ]);

    return (
        <div className={styles.summary}>
            {}
            <div className={styles.copyDiv}>
                <ReadAloudButton
                    requestApiKey={requestApiKey}
                    text={displayText}
                />
                <CopyButton
                    onClick={handleCopySummary}
                    className={styles.copyButton}
                />
                <UndoButton onClick={onUndo} className={styles.undoButton} />
            </div>

            {}
            {isSummarizing || isRewriting ? (
                <div className={styles.shimmerContainer}>
                    <SummaryTextWithLinks
                        summaryText={displayText}
                        links={links}
                    />
                    <div className={styles.shimmerOverlay}></div>
                </div>
            ) : (
                <SummaryTextWithLinks summaryText={displayText} links={links} />
            )}

            {}
            <div className={styles.rewriteRow}>
                {}
                {showRewriteControls ? (
                    <RewriteControls
                        onRewrite={onRewrite}
                        buttonText={buttonText}
                        disabled={isSummarizing || rewriteDisabled}
                        loading={isRewriting}
                        statusText={rewriteStatusText}
                    />
                ) : (
                    <div />
                )}

                {}
                <div className={styles.controlsFloating}>
                    {}
                    <ToggleGroup
                        options={[
                            { label: 'S', value: 'short' },
                            { label: 'M', value: 'medium' },
                            { label: 'L', value: 'long' },
                        ]}
                        selected={currentLength}
                        onSelect={async value => {
                            await handleLengthChange(value as SummaryLength);
                            clearStatusText();
                            setRewriteMode('summary');
                        }}
                        className="lengthSlider"
                        disabled={isSummarizing || isRewriting}
                    />

                    {}
                    <ToggleGroup
                        options={[
                            { label: 'TL', value: 'tldr' },
                            { label: '•', value: 'key-points' },
                        ]}
                        selected={currentType}
                        onSelect={async value => {
                            await handleTypeChange(value as SummaryType);
                            clearStatusText();
                            setRewriteMode('summary');
                        }}
                        className="typeToggle"
                        disabled={isSummarizing || isRewriting}
                    />
                </div>
            </div>

            {}
            <Prompt
                languageModel={languageModel}
                originalText={originalText}
                showInput={showPromptControls}
            />
        </div>
    );
};
