import { useCallback, useState, useRef, type ChangeEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from '../summarizer/shared/SummarizerStyles.module.css';
import { Draggable } from '../../ui';
import {
    VOICE_NAME,
    voice,
    type VoiceName,
} from '../speechGenerator/speechGenerate';
import { SUMMARY_TYPE, SUMMARY_LENGTH } from '../summarizer/summarizeAPI';
import type { SummaryType, SummaryLength } from '../summarizer/summarizeAPI';
import {
    SettingsContext,
    SettingsDispatchContext,
} from '../../contexts/settings';
import { useContextNotNull } from '../../contexts';

interface SettingsModalProps {
    onClose?: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const settings = useContextNotNull(SettingsContext);
    const dispatch = useContextNotNull(SettingsDispatchContext);
    const [autoSummaryWhitelistText, setAutoSummaryWhitelistText] = useState(
        settings.autoSummaryWhitelist.join('\n')
    );
    const [showApiKey, setShowApiKey] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const handleWhitelistChange = useCallback(
        (evt: ChangeEvent<HTMLTextAreaElement>) => {
            const value = evt.target.value;

            setAutoSummaryWhitelistText(value);

            const autoSummaryWhitelist = value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length);

            dispatch({ type: 'setAutoSummaryWhitelist', autoSummaryWhitelist });
        },
        [dispatch]
    );
    const playVoice = useCallback((voiceName: VoiceName) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        const voiceFileName =
            voiceName.charAt(0) + voiceName.slice(1).toLowerCase();
        const audioUrl = chrome.runtime.getURL(`voices/${voiceFileName}.wav`);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setIsPlayingVoice(true);

        audio.addEventListener('ended', () => {
            setIsPlayingVoice(false);
        });

        audio.addEventListener('error', () => {
            setIsPlayingVoice(false);
            console.error('Failed to play voice sample');
        });

        audio.play().catch(error => {
            setIsPlayingVoice(false);
            console.error('Error playing audio:', error);
        });
    }, []);

    const handleVoiceChange = useCallback(
        (evt: ChangeEvent<HTMLSelectElement>) => {
            const selectedVoice = evt.target.value as VoiceName;

            dispatch({ type: 'setVoice', voice: selectedVoice });
            playVoice(selectedVoice);
        },
        [dispatch, playVoice]
    );
    const handleSummaryTypeChange = useCallback(
        (evt: ChangeEvent<HTMLSelectElement>) => {
            const summaryType = evt.target.value as SummaryType;

            dispatch({ type: 'setSummaryType', summaryType });
        },
        [dispatch]
    );
    const handleSummaryLengthChange = useCallback(
        (evt: ChangeEvent<HTMLSelectElement>) => {
            const summaryLength = evt.target.value as SummaryLength;

            dispatch({ type: 'setSummaryLength', summaryLength });
        },
        [dispatch]
    );
    const handleApiKeyChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const apiKey = evt.target.value;

            dispatch({ type: 'setApiKey', apiKey });
        },
        [dispatch]
    );
    const handleAutoSummaryEnabledChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const autoSummaryEnabled = evt.target.checked;

            dispatch({ type: 'setAutoSummaryEnabled', autoSummaryEnabled });
        },
        [dispatch]
    );

    return (
        <Draggable
            storageKey="minerva-settings-position"
            initialPosition="center"
            className={styles.container}
        >
            {/* Close Button */}
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
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Settings</h2>

                {/* Auto-summary toggle and whitelist */}
                <div className={styles.inputGroup}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                        }}
                    >
                        <input
                            type="checkbox"
                            id="autoSummaryEnabled"
                            checked={settings.autoSummaryEnabled}
                            onChange={handleAutoSummaryEnabledChange}
                            style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                            }}
                        />
                        <label
                            htmlFor="autoSummaryEnabled"
                            className={styles.label}
                            style={{
                                margin: 0,
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                        >
                            Enable Auto-Summary
                        </label>
                    </div>
                    <label className={styles.label}>
                        Auto-summary whitelist (one per line):
                    </label>
                    <textarea
                        value={autoSummaryWhitelistText}
                        onChange={handleWhitelistChange}
                        placeholder="Enter domains or patterns (one per line)"
                        rows={4}
                        className={styles.textarea}
                        disabled={!settings.autoSummaryEnabled}
                        style={{
                            opacity: settings.autoSummaryEnabled ? 1 : 0.6,
                        }}
                    />
                </div>

                {/* Voice selector */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Voice:</label>
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                        }}
                    >
                        <select
                            value={settings.voice}
                            onChange={handleVoiceChange}
                            className={styles.select}
                            style={{ flex: 1 }}
                        >
                            {Object.entries(VOICE_NAME).map(([key, value]) => {
                                const formattedKey =
                                    key.charAt(0) + key.slice(1).toLowerCase();
                                const formattedStyle =
                                    voice[value].charAt(0) +
                                    voice[value]
                                        .slice(1)
                                        .toLowerCase()
                                        .replace(/_/g, ' ');
                                return (
                                    <option key={key} value={value}>
                                        {formattedKey} - {formattedStyle}
                                    </option>
                                );
                            })}
                        </select>
                        <img
                            src={chrome.runtime.getURL(
                                isPlayingVoice
                                    ? 'icons/audio-playing.svg'
                                    : 'icons/audio.svg'
                            )}
                            alt={isPlayingVoice ? 'Playing' : 'Audio indicator'}
                            style={{ width: '36px', height: '36px' }}
                        />
                    </div>
                </div>

                {/* Summary settings */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Summary:</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <label
                                className={styles.label}
                                style={{
                                    fontSize: '12px',
                                    marginBottom: '6px',
                                }}
                            >
                                Type:
                            </label>
                            <select
                                value={settings.summaryType}
                                onChange={handleSummaryTypeChange}
                                className={styles.select}
                            >
                                {Object.entries(SUMMARY_TYPE).map(
                                    ([key, value]) => (
                                        <option key={key} value={value}>
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label
                                className={styles.label}
                                style={{
                                    fontSize: '12px',
                                    marginBottom: '6px',
                                }}
                            >
                                Length:
                            </label>
                            <select
                                value={settings.summaryLength}
                                onChange={handleSummaryLengthChange}
                                className={styles.select}
                            >
                                {Object.entries(SUMMARY_LENGTH).map(
                                    ([key, value]) => (
                                        <option key={key} value={value}>
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Google API Key */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        <a
                            href="https://aistudio.google.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#007bff',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                            onMouseOver={e =>
                                (e.currentTarget.style.textDecoration =
                                    'underline')
                            }
                            onMouseOut={e =>
                                (e.currentTarget.style.textDecoration = 'none')
                            }
                        >
                            Google API Key:
                        </a>
                    </label>
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                        }}
                    >
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={settings.apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Google AI Studio API Key"
                            className={styles.textInput}
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className={styles.buttonSecondary}
                            style={{
                                padding: '10px 16px',
                                minWidth: '60px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            type="button"
                        >
                            {showApiKey ? (
                                <Eye size={18} />
                            ) : (
                                <EyeOff size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Draggable>
    );
}
