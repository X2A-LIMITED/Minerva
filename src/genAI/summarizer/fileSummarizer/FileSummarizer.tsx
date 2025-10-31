import { useCallback, useEffect, useState } from 'react';
import { PdfUploader } from './FileUpload.tsx';
import { fileSummarize } from './fileSummarize.ts';
import { Draggable } from '../../../ui/atoms/index.ts';
import { NavControls } from '../../../ui/molecules/NavControls/NavControls';
import styles from '../shared/SummarizerStyles.module.css';
import { SettingsContext } from '../../../contexts/settings.ts';
import { useContextNotNull } from '../../../contexts/index.ts';

interface FileSummarizerProps {
    requestApiKey: () => void;
    onClose?: () => void;
}

interface FileHistory {
    fileName: string;
    summary: string;
    timestamp: Date;
}

type IsWaitingApiKey = { status: true; file: File } | { status: false };

export default function FileSummarizer({
    requestApiKey,
    onClose,
}: FileSummarizerProps) {
    const settings = useContextNotNull(SettingsContext);
    const [history, setHistory] = useState<FileHistory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingApiKey, setIsWaitingApiKey] = useState<IsWaitingApiKey>({
        status: false,
    });
    const currentEntry = currentIndex >= 0 ? history[currentIndex] : null;
    const handleFileSelect = useCallback(
        async (file: File) => {
            if (file == null) {
                return;
            }

            if (settings.apiKey) {
                setIsLoading(true);

                try {
                    const summary = await fileSummarize(settings.apiKey, file, {
                        type: settings.summaryType,
                        length: settings.summaryLength,
                    });
                    if (summary != null) {
                        const newEntry: FileHistory = {
                            fileName: file.name,
                            summary,
                            timestamp: new Date(),
                        };

                        setHistory(prev => [...prev, newEntry]);
                        setCurrentIndex(prev => prev + 1);
                    }
                } catch (error) {
                    console.error('File Summarization Error:', error);
                    alert('Failed to summarize file. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsWaitingApiKey({ status: true, file });
                requestApiKey();
            }
        },
        [settings.apiKey, requestApiKey]
    );

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

    useEffect(() => {
        if (isWaitingApiKey.status && settings.apiKey) {
            setIsWaitingApiKey({ status: false });
            handleFileSelect(isWaitingApiKey.file);
        }
    }, [settings.apiKey, isWaitingApiKey, handleFileSelect]);

    return (
        <Draggable
            storageKey="minerva-file-summary-position"
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
                {/* Upload Area */}
                <div className={styles.uploadSection}>
                    <div
                        data-no-drag="true"
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <PdfUploader
                            onFileSelect={handleFileSelect}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Summary with History */}
                {currentEntry && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>📄 File Name</div>
                            <div className={styles.cardContent}>
                                {currentEntry.fileName}
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
