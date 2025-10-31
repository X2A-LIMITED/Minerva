import { useState, useCallback } from 'react';
import {
    speechGenerate,
    VOICE_NAME,
    voice,
    type VoiceName,
} from './speechGenerate.ts';
import { Draggable, LoadingButton } from '../../ui/atoms';
import { NavControls } from '../../ui/molecules/NavControls/NavControls';
import styles from '../summarizer/shared/SummarizerStyles.module.css';
import { SettingsContext, useContextNotNull } from '../../contexts/index.ts';

interface SpeechGeneratorProps {
    requestApiKey: () => void;
    onClose?: () => void;
}

interface SpeechHistory {
    text: string;
    voice: VoiceName;
    audio: string;
    timestamp: Date;
}

export default function SpeechGenerator({
    requestApiKey,
    onClose,
}: SpeechGeneratorProps) {
    const settings = useContextNotNull(SettingsContext);
    const [selectedVoice, setSelectedVoice] = useState<VoiceName>(
        settings.voice
    );
    const [textContent, setTextContent] = useState('');
    const [history, setHistory] = useState<SpeechHistory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const currentEntry = currentIndex >= 0 ? history[currentIndex] : null;

    const handleSendClick = useCallback(async () => {
        if (!textContent.trim()) {
            alert('Please enter some text to convert to speech');
            return;
        }

        if (settings.apiKey) {
            setIsLoading(true);
            try {
                const audioData = await speechGenerate(
                    settings.apiKey,
                    textContent,
                    selectedVoice,
                    'Say Cheerfully'
                );

                const newEntry: SpeechHistory = {
                    text: textContent,
                    voice: selectedVoice,
                    audio: audioData,
                    timestamp: new Date(),
                };

                setHistory(prev => [...prev, newEntry]);
                setCurrentIndex(prev => prev + 1);
                setTextContent('');
            } catch (error) {
                console.error('TTS Error:', error);
                alert('Failed to generate speech. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            requestApiKey();
        }
    }, [textContent, selectedVoice, settings.apiKey, requestApiKey]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
    }, [history.length]);

    const handleCopy = useCallback(async () => {
        if (!currentEntry) return;

        try {
            await navigator.clipboard.writeText(currentEntry.text);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }, [currentEntry]);

    const handleDownload = useCallback(() => {
        if (!currentEntry) return;

        const link = document.createElement('a');
        link.href = currentEntry.audio;
        link.download = `speech-${Date.now()}.mp3`;
        link.click();
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
            storageKey="minerva-speech-generator-position"
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
                    {/* Voice Selection Dropdown */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Select Voice:</label>
                        <select
                            value={selectedVoice}
                            onChange={e =>
                                setSelectedVoice(e.target.value as VoiceName)
                            }
                            className={styles.select}
                        >
                            {Object.entries(VOICE_NAME).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {key} [{voice[value]}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Text Input Box */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Text Content:</label>
                        <textarea
                            value={textContent}
                            onChange={e => setTextContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter text to convert to speech..."
                            rows={4}
                            className={styles.textarea}
                        />
                    </div>

                    {/* Send Button */}
                    <LoadingButton
                        onClick={handleSendClick}
                        disabled={isLoading}
                        isLoading={isLoading}
                        loadingText="Generating..."
                        idleText="🎙️ Generate Speech"
                        svgPath="icons/gen-loop.svg"
                    />

                    {/* Audio Player with History */}
                    {currentEntry && (
                        <div className={styles.summarySection}>
                            <div className={styles.resultCard}>
                                <div className={styles.cardLabel}>🗣️ Voice</div>
                                <div className={styles.cardContent}>
                                    {Object.keys(VOICE_NAME).find(
                                        key =>
                                            VOICE_NAME[
                                                key as keyof typeof VOICE_NAME
                                            ] === currentEntry.voice
                                    )}{' '}
                                    [{voice[currentEntry.voice]}]
                                </div>
                            </div>

                            <div className={styles.resultCard}>
                                <div className={styles.cardLabel}>💬 Text</div>
                                <div className={styles.cardContent}>
                                    {currentEntry.text}
                                </div>
                                {/* Floating Copy Button in Card */}
                                <button
                                    onClick={handleCopy}
                                    className={styles.cardCopyButton}
                                    title="Copy text to clipboard"
                                    aria-label="Copy text"
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

                            <div className={styles.audioPreview}>
                                <div className={styles.audioWrapper}>
                                    <audio
                                        controls
                                        src={currentEntry.audio}
                                        className={styles.audioPlayer}
                                    />
                                    {/* Floating Download Button */}
                                    <button
                                        onClick={handleDownload}
                                        className={styles.audioDownloadButton}
                                        title="Download audio"
                                        aria-label="Download audio"
                                    >
                                        ⬇
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Draggable>
    );
}
