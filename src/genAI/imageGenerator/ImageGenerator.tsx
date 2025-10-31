import { useState, useCallback } from 'react';
import { imageGenerate } from './imageGenerate';
import { type GeneratedImage } from '@google/genai';
import { Draggable, LoadingButton } from '../../ui/atoms';
import { NavControls } from '../../ui/molecules/NavControls/NavControls';
import styles from '../summarizer/shared/SummarizerStyles.module.css';
import { SettingsContext, useContextNotNull } from '../../contexts';

interface ImageGeneratorProps {
    requestApiKey: () => void;
    onClose?: () => void;
}

interface ImageHistory {
    prompt: string;
    image: GeneratedImage;
    timestamp: Date;
}

export default function ImageGenerator({
    requestApiKey,
    onClose,
}: ImageGeneratorProps) {
    const { apiKey } = useContextNotNull(SettingsContext);
    const [textContent, setTextContent] = useState('');
    const [history, setHistory] = useState<ImageHistory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const currentEntry = currentIndex >= 0 ? history[currentIndex] : null;

    const handleSendClick = useCallback(async () => {
        if (!textContent.trim()) {
            alert('Please enter some text to generate image');
            return;
        }

        if (apiKey) {
            setIsLoading(true);
            try {
                const image = await imageGenerate(apiKey, textContent);
                if (image == null) {
                    return;
                }
                const newEntry: ImageHistory = {
                    prompt: textContent,
                    image,
                    timestamp: new Date(),
                };

                setHistory(prev => [...prev, newEntry]);
                setCurrentIndex(prev => prev + 1);
                setTextContent('');
            } catch (error) {
                console.error('Image Generation Error:', error);
                alert('Failed to generate image. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            requestApiKey();
        }
    }, [textContent, apiKey, requestApiKey]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
    }, [history.length]);

    const handleDownload = useCallback(() => {
        if (!currentEntry) return;

        const link = document.createElement('a');
        link.href = `data:${currentEntry.image.image?.mimeType};base64,${currentEntry.image.image?.imageBytes}`;
        link.download = `generated-image-${Date.now()}.png`;
        link.click();
    }, [currentEntry]);

    const handleCopy = useCallback(async () => {
        if (!currentEntry) return;

        try {
            await navigator.clipboard.writeText(currentEntry.prompt);
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
            storageKey="minerva-image-generator-position"
            initialPosition={{ x: 100, y: 100 }}
        >
            <div className={styles.container}>
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
                    {/* Text Input Box with Counter */}
                    <div className={styles.inputGroup}>
                        <div className={styles.inputWithCounter}>
                            <textarea
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="A serene mountain landscape at sunset with golden light"
                                rows={4}
                                className={styles.textarea}
                                maxLength={500}
                            />
                            <span className={styles.characterCounter}>
                                {textContent.length}/500
                            </span>
                        </div>
                    </div>

                    {/* Send Button */}
                    <LoadingButton
                        onClick={handleSendClick}
                        disabled={isLoading || !textContent.trim()}
                        isLoading={isLoading}
                        loadingText="Creating Magic..."
                        idleText="✨ Generate Image"
                        svgPath="icons/gen-loop.svg"
                    />

                    {/* Image Result with History */}
                    {currentEntry && (
                        <div className={styles.summarySection}>
                            <div className={styles.resultCard}>
                                <div className={styles.cardLabel}>
                                    💭 Prompt
                                </div>
                                <div className={styles.cardContent}>
                                    {currentEntry.prompt}
                                </div>
                                {/* Floating Copy Button in Card */}
                                <button
                                    onClick={handleCopy}
                                    className={styles.cardCopyButton}
                                    title="Copy prompt to clipboard"
                                    aria-label="Copy prompt"
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

                            <div className={styles.imagePreview}>
                                <div className={styles.imageWrapper}>
                                    <img
                                        src={`data:${currentEntry.image.image?.mimeType};base64,${currentEntry.image.image?.imageBytes}`}
                                        alt="Generated"
                                        className={styles.generatedImage}
                                    />
                                    {/* Floating Download Button */}
                                    <button
                                        onClick={handleDownload}
                                        className={styles.imageDownloadButton}
                                        title="Download image"
                                        aria-label="Download image"
                                    >
                                        ⬇
                                    </button>
                                </div>
                            </div>

                            {/* Image Metadata */}
                            <div className={styles.imageMetadata}>
                                <div className={styles.metadataItem}>
                                    <span className={styles.metadataLabel}>
                                        📅 Created:
                                    </span>
                                    {new Date(
                                        currentEntry.timestamp
                                    ).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Draggable>
    );
}
