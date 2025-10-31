import { useState, useEffect, useRef } from 'react';
import styles from '../summarizer/shared/SummarizerStyles.module.css';
import { Draggable, LoadingButton } from '../../ui';
import { NavControls } from '../../ui/molecules/NavControls';
import {
    ServerTranslate,
    type LanguageCode,
    type TranslateConfig,
    LANGUAGE_CODE,
    LANGUAGE_NAMES,
} from './translator.ts';

export async function translateText(
    text: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
) {
    const server = new ServerTranslate();
    const config: TranslateConfig = { sourceLanguage, targetLanguage };
    const res = await server.translate({ text, config });
    if (res.kind !== 'success') {
        throw new Error('translation error');
    }
    return res.text;
}

interface HistoryEntry {
    input: string;
    output: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
}

interface TranslateOverlayProps {
    onClose?: () => void;
}

export default function TranslateOverlay({ onClose }: TranslateOverlayProps) {
    const [inputText, setInputText] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
    const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('es');
    const [isLoading, setIsLoading] = useState(false);

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const [sourceSearchOpen, setSourceSearchOpen] = useState(false);
    const [targetSearchOpen, setTargetSearchOpen] = useState(false);
    const [sourceSearch, setSourceSearch] = useState('');
    const [targetSearch, setTargetSearch] = useState('');

    const sourceRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);

    const currentEntry = history[currentIndex];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                sourceRef.current &&
                !sourceRef.current.contains(event.target as Node)
            ) {
                setSourceSearchOpen(false);
            }
            if (
                targetRef.current &&
                !targetRef.current.contains(event.target as Node)
            ) {
                setTargetSearchOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const allLanguages = Object.values(LANGUAGE_CODE).map(code => ({
        code: code as LanguageCode,
        name: LANGUAGE_NAMES[code as LanguageCode],
    }));

    const filteredSourceLanguages = allLanguages.filter(
        lang =>
            lang.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
            lang.code.toLowerCase().includes(sourceSearch.toLowerCase())
    );

    const filteredTargetLanguages = allLanguages.filter(
        lang =>
            lang.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
            lang.code.toLowerCase().includes(targetSearch.toLowerCase())
    );

    function swapLanguages() {
        const temp = sourceLanguage;
        setSourceLanguage(targetLanguage);
        setTargetLanguage(temp);
    }

    async function handleTranslate() {
        if (!inputText.trim()) {
            alert('Please enter some text');
            return;
        }

        setIsLoading(true);
        try {
            const result = await translateText(
                inputText,
                sourceLanguage,
                targetLanguage
            );

            const newEntry: HistoryEntry = {
                input: inputText,
                output: result,
                sourceLanguage,
                targetLanguage,
            };

            setHistory(prev => [...prev, newEntry]);
            setCurrentIndex(history.length);
        } catch (error) {
            console.error('Translation error:', error);
            alert('Failed to translate text. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    function navigatePrevious() {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }

    function navigateNext() {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }

    const handleCopy = async () => {
        if (!currentEntry) return;

        try {
            await navigator.clipboard.writeText(currentEntry.output);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTranslate();
        }
    };

    return (
        <Draggable
            storageKey="minerva-translate-position"
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
                {/* Input Text */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Input Text:</label>
                    <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter text to translate..."
                        rows={4}
                        className={styles.textarea}
                        disabled={isLoading}
                    />
                </div>

                {/* Language Selection */}
                <div className={styles.inputGroup}>
                    <div
                        className={styles.languageSelector}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-end',
                        }}
                    >
                        <div
                            ref={sourceRef}
                            className={styles.languageField}
                            style={{ flex: 1, position: 'relative' }}
                            data-no-drag="true"
                        >
                            <label className={styles.label}>From:</label>
                            <div
                                onClick={e => {
                                    e.stopPropagation();
                                    if (!isLoading) {
                                        setSourceSearchOpen(!sourceSearchOpen);
                                    }
                                }}
                                onMouseDown={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className={styles.select}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                data-no-drag="true"
                            >
                                <span>{LANGUAGE_NAMES[sourceLanguage]}</span>
                                <span>{sourceSearchOpen ? '▲' : '▼'}</span>
                            </div>
                            {sourceSearchOpen && (
                                <div
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        background: 'white',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '10px',
                                        marginTop: '4px',
                                        maxHeight: '300px',
                                        overflow: 'auto',
                                        boxShadow:
                                            '0 8px 24px rgba(0, 0, 0, 0.15)',
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={sourceSearch}
                                        onChange={e =>
                                            setSourceSearch(e.target.value)
                                        }
                                        onMouseDown={e => e.stopPropagation()}
                                        onClick={e => e.stopPropagation()}
                                        placeholder="Search languages..."
                                        className={styles.textarea}
                                        style={{
                                            margin: '8px',
                                            width: 'calc(100% - 16px)',
                                            padding: '8px 12px',
                                        }}
                                        autoFocus
                                    />
                                    <div>
                                        {filteredSourceLanguages.map(lang => (
                                            <div
                                                key={lang.code}
                                                onClick={() => {
                                                    setSourceLanguage(
                                                        lang.code
                                                    );
                                                    setSourceSearchOpen(false);
                                                    setSourceSearch('');
                                                }}
                                                style={{
                                                    padding: '10px 16px',
                                                    cursor: 'pointer',
                                                    background:
                                                        sourceLanguage ===
                                                        lang.code
                                                            ? 'rgba(0, 123, 255, 0.1)'
                                                            : 'transparent',
                                                    transition:
                                                        'background 0.2s',
                                                }}
                                                onMouseEnter={e => {
                                                    if (
                                                        sourceLanguage !==
                                                        lang.code
                                                    ) {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.background =
                                                            'rgba(0, 0, 0, 0.05)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (
                                                        sourceLanguage !==
                                                        lang.code
                                                    ) {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.background =
                                                            'transparent';
                                                    }
                                                }}
                                            >
                                                {lang.name}{' '}
                                                <span
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    ({lang.code})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={swapLanguages}
                            disabled={isLoading}
                            className={styles.button}
                            style={{
                                width: '48px',
                                minWidth: '48px',
                                height: '48px',
                                padding: '0',
                                background: 'rgba(0, 123, 255, 0.1)',
                                border: '1px solid rgba(0, 123, 255, 0.2)',
                                color: '#007bff',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                            title="Swap languages"
                        >
                            ⇄
                        </button>

                        <div
                            ref={targetRef}
                            className={styles.languageField}
                            style={{ flex: 1, position: 'relative' }}
                            data-no-drag="true"
                        >
                            <label className={styles.label}>To:</label>
                            <div
                                onClick={e => {
                                    e.stopPropagation();
                                    if (!isLoading) {
                                        setTargetSearchOpen(!targetSearchOpen);
                                    }
                                }}
                                onMouseDown={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className={styles.select}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                data-no-drag="true"
                            >
                                <span>{LANGUAGE_NAMES[targetLanguage]}</span>
                                <span>{targetSearchOpen ? '▲' : '▼'}</span>
                            </div>
                            {targetSearchOpen && (
                                <div
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        background: 'white',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '10px',
                                        marginTop: '4px',
                                        maxHeight: '300px',
                                        overflow: 'auto',
                                        boxShadow:
                                            '0 8px 24px rgba(0, 0, 0, 0.15)',
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={targetSearch}
                                        onChange={e =>
                                            setTargetSearch(e.target.value)
                                        }
                                        onMouseDown={e => e.stopPropagation()}
                                        onClick={e => e.stopPropagation()}
                                        placeholder="Search languages..."
                                        className={styles.textarea}
                                        style={{
                                            margin: '8px',
                                            width: 'calc(100% - 16px)',
                                            padding: '8px 12px',
                                        }}
                                        autoFocus
                                    />
                                    <div>
                                        {filteredTargetLanguages.map(lang => (
                                            <div
                                                key={lang.code}
                                                onClick={() => {
                                                    setTargetLanguage(
                                                        lang.code
                                                    );
                                                    setTargetSearchOpen(false);
                                                    setTargetSearch('');
                                                }}
                                                style={{
                                                    padding: '10px 16px',
                                                    cursor: 'pointer',
                                                    background:
                                                        targetLanguage ===
                                                        lang.code
                                                            ? 'rgba(0, 123, 255, 0.1)'
                                                            : 'transparent',
                                                    transition:
                                                        'background 0.2s',
                                                }}
                                                onMouseEnter={e => {
                                                    if (
                                                        targetLanguage !==
                                                        lang.code
                                                    ) {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.background =
                                                            'rgba(0, 0, 0, 0.05)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (
                                                        targetLanguage !==
                                                        lang.code
                                                    ) {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.background =
                                                            'transparent';
                                                    }
                                                }}
                                            >
                                                {lang.name}{' '}
                                                <span
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    ({lang.code})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <LoadingButton
                    onClick={handleTranslate}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Translating..."
                    idleText="🌐 Translate"
                    svgPath="icons/gen-loop.svg"
                />

                {/* Result Section with History Navigation */}
                {history.length > 0 && currentEntry && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>
                                Original Text (
                                {currentEntry.sourceLanguage.toUpperCase()})
                            </div>
                            <div className={styles.cardContent}>
                                {currentEntry.input}
                            </div>
                        </div>

                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>
                                Translation (
                                {currentEntry.targetLanguage.toUpperCase()})
                            </div>
                            <div className={styles.cardContent}>
                                {currentEntry.output}
                            </div>
                            {/* Floating Copy Button in Card */}
                            <button
                                onClick={handleCopy}
                                className={styles.cardCopyButton}
                                title="Copy output to clipboard"
                                aria-label="Copy output"
                            >
                                📋
                            </button>
                            {/* NavControls inside card */}
                            {history.length > 1 && (
                                <NavControls
                                    currentIndex={currentIndex}
                                    total={history.length}
                                    onPrevious={navigatePrevious}
                                    onNext={navigateNext}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Draggable>
    );
}
