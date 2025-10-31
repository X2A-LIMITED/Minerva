import { useState, useCallback } from 'react';
import { videoSummarization } from './videoSummarization.ts';
import { Draggable, LoadingButton } from '../../../ui/atoms';
import { NavControls } from '../../../ui/molecules/NavControls/NavControls';
import styles from '../shared/SummarizerStyles.module.css';
import { SettingsContext, useContextNotNull } from '../../../contexts/index.ts';

interface YoutubeSummaryUIProps {
    requestApiKey: () => void;
    onClose?: () => void;
    initialUrl?: string;
}

interface YoutubeHistory {
    url: string;
    summary: string;
    timestamp: Date;
}

export default function YoutubeSummaryUI({
    requestApiKey,
    onClose,
    initialUrl = '',
}: YoutubeSummaryUIProps) {
    const { apiKey } = useContextNotNull(SettingsContext);
    const [videoUri, setVideoUri] = useState(initialUrl);
    const [history, setHistory] = useState<YoutubeHistory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const currentEntry = currentIndex >= 0 ? history[currentIndex] : null;

    const handleSendClick = useCallback(async () => {
        if (!videoUri.trim()) {
            alert('Please enter a video URL');
            return;
        }

        if (apiKey) {
            setIsLoading(true);

            try {
                const summary = await videoSummarization(apiKey, videoUri);

                if (summary != null) {
                    const newEntry: YoutubeHistory = {
                        url: videoUri,
                        summary,
                        timestamp: new Date(),
                    };

                    setHistory(prev => [...prev, newEntry]);
                    setCurrentIndex(prev => prev + 1);
                    setVideoUri('');
                }
            } catch (error) {
                console.error('Video Summarization Error:', error);
                alert('Failed to summarize video. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            requestApiKey();
        }
    }, [videoUri, apiKey, requestApiKey]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
    }, [history.length]);

    const handleCopy = useCallback(async () => {
        if (!currentEntry) return;

        try {
            await navigator.clipboard.writeText(currentEntry.summary);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }, [currentEntry]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
            }
        },
        [handleSendClick]
    );

    return (
        <Draggable
            storageKey="minerva-youtube-summary-position"
            initialPosition="center"
            className={styles.container}
        >
            {/* Modern Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                    aria-label="Close"
                    title="Close"
                >
                    ✕
                </button>
            )}

            <div className={styles.contentWrapper}>
                {/* Text Input Box */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Youtube Link:</label>
                    <textarea
                        value={videoUri}
                        onChange={e => setVideoUri(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="https://www.youtube.com/watch?v=2kxvInMAekU"
                        rows={1}
                        className={styles.textarea}
                    />
                </div>

                {/* Send Button */}
                <LoadingButton
                    onClick={handleSendClick}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Generating..."
                    idleText="🎬 Summarize Youtube"
                    svgPath="icons/tldr-loop.svg"
                />

                {/* Summary with History */}
                {currentEntry && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>
                                🔗 Youtube Link
                            </div>
                            <div className={styles.cardContent}>
                                {currentEntry.url}
                            </div>
                        </div>

                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>📝 Summary</div>
                            <div className={styles.cardContent}>
                                {currentEntry.summary}
                            </div>
                            {/* Floating Copy Button in Card */}
                            <button
                                onClick={handleCopy}
                                className={styles.cardCopyButton}
                                title="Copy summary to clipboard"
                                aria-label="Copy summary"
                            >
                                📋
                            </button>
                            {/* NavControls inside card */}
                            {history.length > 1 && (
                                <NavControls
                                    currentIndex={currentIndex}
                                    total={history.length}
                                    onPrevious={handlePrevious}
                                    onNext={handleNext}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Draggable>
    );
}
