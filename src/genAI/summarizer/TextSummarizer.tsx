import { useState, useCallback } from 'react';
import { Draggable, LoadingButton } from '../../ui/atoms';
import { NavControls } from '../../ui/molecules/NavControls/NavControls';
import { LanguageSelector } from '../../ui/molecules/LanguageSelector/LanguageSelector';
import {
    ServerSummarizer,
    SUMMARY_TYPE,
    SUMMARY_LENGTH,
    type SummaryType,
    type SummaryLength,
} from './summarizeAPI';
import type { LanguageCode } from '../translate/translator';
import styles from './shared/SummarizerStyles.module.css';
import { SettingsContext, useContextNotNull } from '../../contexts';

interface TextSummarizerUIProps {
    onClose?: () => void;
}

interface TextHistory {
    text: string;
    summary: string;
    timestamp: Date;
}

export default function TextSummarizerUI({
    onClose,
}: TextSummarizerUIProps = {}) {
    const settings = useContextNotNull(SettingsContext);
    const [textInput, setTextInput] = useState('');
    const [history, setHistory] = useState<TextHistory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summaryType, setSummaryType] = useState<SummaryType>(
        settings.summaryType
    );
    const [summaryLength, setSummaryLength] = useState<SummaryLength>(
        settings.summaryLength
    );
    const [outputLanguage, setOutputLanguage] = useState<LanguageCode>('en');
    const [inputLanguage, setInputLanguage] = useState<LanguageCode>('en');

    const currentEntry = currentIndex >= 0 ? history[currentIndex] : null;

    const handleSummarizeClick = useCallback(async () => {
        if (!textInput.trim()) {
            alert('Please enter some text to summarize');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const summarizer = new ServerSummarizer('Text summary');
            const result = await summarizer.summarize({
                text: textInput,
                config: {
                    type: summaryType,
                    length: summaryLength,
                    format: 'markdown',
                    outputLanguage: outputLanguage,
                    expectedInputLanguages: [inputLanguage],
                },
            });

            if (result.kind === 'success') {
                const newEntry: TextHistory = {
                    text: textInput,
                    summary: result.summary,
                    timestamp: new Date(),
                };

                setHistory(prev => [...prev, newEntry]);
                setCurrentIndex(prev => prev + 1);
                setTextInput('');
            } else if (result.kind === 'not-supported') {
                setError(
                    'Summarizer API is not supported in your browser. Please use Chrome Canary or Edge Dev with the AI features enabled.'
                );
            } else if (result.kind === 'no-model-available') {
                setError(
                    'No summarizer model is available. Please check your browser settings.'
                );
            } else if (result.kind === 'aborted') {
                setError('Summarization was aborted.');
            }
        } catch (error) {
            console.error('Text Summarization Error:', error);
            setError('Failed to summarize text. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [textInput, summaryType, summaryLength, outputLanguage, inputLanguage]);

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

    return (
        <Draggable
            storageKey="minerva-text-summary-position"
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
                {/* Summary Type Toggle */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Summary Type:</label>
                    <div
                        className="minerva-toggle-group"
                        style={{
                            display: 'flex',
                            gap: '0',
                            background: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '12px',
                            padding: '4px',
                        }}
                    >
                        <button
                            onClick={() => setSummaryType(SUMMARY_TYPE.TLDR)}
                            disabled={isLoading}
                            className={`${styles.button} ${summaryType === SUMMARY_TYPE.TLDR ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryType === SUMMARY_TYPE.TLDR
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            TL;DR
                        </button>
                        <button
                            onClick={() =>
                                setSummaryType(SUMMARY_TYPE.KEY_POINTS)
                            }
                            disabled={isLoading}
                            className={`${styles.button} ${summaryType === SUMMARY_TYPE.KEY_POINTS ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryType === SUMMARY_TYPE.KEY_POINTS
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Key Points
                        </button>
                        <button
                            onClick={() => setSummaryType(SUMMARY_TYPE.TEASER)}
                            disabled={isLoading}
                            className={`${styles.button} ${summaryType === SUMMARY_TYPE.TEASER ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryType === SUMMARY_TYPE.TEASER
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Teaser
                        </button>
                        <button
                            onClick={() =>
                                setSummaryType(SUMMARY_TYPE.HEADLINE)
                            }
                            disabled={isLoading}
                            className={`${styles.button} ${summaryType === SUMMARY_TYPE.HEADLINE ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryType === SUMMARY_TYPE.HEADLINE
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            HEADLINE
                        </button>
                    </div>
                </div>

                {/* Summary Length Slider */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        Length: {summaryLength}
                    </label>
                    <div
                        className="minerva-length-slider"
                        style={{
                            display: 'flex',
                            gap: '0',
                            background: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '12px',
                            padding: '4px',
                        }}
                    >
                        <button
                            onClick={() =>
                                setSummaryLength(SUMMARY_LENGTH.SHORT)
                            }
                            disabled={isLoading}
                            className={`${styles.button} ${summaryLength === SUMMARY_LENGTH.SHORT ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryLength === SUMMARY_LENGTH.SHORT
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Short
                        </button>
                        <button
                            onClick={() =>
                                setSummaryLength(SUMMARY_LENGTH.MEDIUM)
                            }
                            disabled={isLoading}
                            className={`${styles.button} ${summaryLength === SUMMARY_LENGTH.MEDIUM ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryLength === SUMMARY_LENGTH.MEDIUM
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Medium
                        </button>
                        <button
                            onClick={() =>
                                setSummaryLength(SUMMARY_LENGTH.LONG)
                            }
                            disabled={isLoading}
                            className={`${styles.button} ${summaryLength === SUMMARY_LENGTH.LONG ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    summaryLength === SUMMARY_LENGTH.LONG
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Long
                        </button>
                    </div>
                </div>

                {/* Language Selection */}
                <div className={styles.inputGroup}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-end',
                        }}
                    >
                        <LanguageSelector
                            value={inputLanguage}
                            onChange={setInputLanguage}
                            label="Input Language"
                            disabled={isLoading}
                        />
                        <LanguageSelector
                            value={outputLanguage}
                            onChange={setOutputLanguage}
                            label="Output Language"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Text Input Box */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Text to summarize:</label>
                    <textarea
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder="Paste or type your text here..."
                        rows={8}
                        className={styles.textarea}
                    />
                </div>

                {/* Generate Button */}
                <LoadingButton
                    onClick={handleSummarizeClick}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Summarizing..."
                    idleText="📝 Summarize Text"
                    svgPath="icons/tldr-loop.svg"
                />

                {/* Error Display */}
                {error && <div className={styles.errorBox}>{error}</div>}

                {/* Summary Display with History */}
                {currentEntry && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>
                                📄 Original Text
                            </div>
                            <div className={styles.cardContent}>
                                {currentEntry.text}
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
