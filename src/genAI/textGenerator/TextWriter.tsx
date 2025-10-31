import { useState } from 'react';
import styles from '../summarizer/shared/SummarizerStyles.module.css';
import { Draggable, LoadingButton } from '../../ui';
import { NavControls } from '../../ui/molecules/NavControls';
import {
    ServerWriter,
    type WriterConfig,
    type WritingResult,
} from './writer.ts';
import {
    ServerRewriter,
    type RewriterConfig,
    type RewritingResult,
} from './rewriter.ts';

export async function writeText(
    text: string,
    sharedContext: string
): Promise<WritingResult> {
    const server = new ServerWriter();
    const config: WriterConfig = { sharedContext };
    const res = await server.write(text, { config });

    return res;
}

export async function rewriteText(
    text: string,
    sharedContext: string
): Promise<RewritingResult> {
    const server = new ServerRewriter();
    const config: RewriterConfig = { sharedContext };
    const res = await server.rewrite(text, { config });

    return res;
}

type OperationType = 'write' | 'rewrite';

interface HistoryEntry {
    input: string;
    output: string;
    operation: OperationType;
    sharedContext: string;
}

interface TextWriterProps {
    onClose?: () => void;
}

const WRITING_RESULT_ERROR_MAP: Record<
    RewritingResult['kind'],
    React.ReactElement | null
> = {
    success: null,
    'not-supported': (
        <>
            Writer API not available in this browser.{' '}
            <a href="https://developer.chrome.com/docs/ai/writer-api#get_started">
                Please enable
            </a>
        </>
    ),
    'no-model-available': <>Writer model not available yet</>,
    aborted: <>Write cancelled</>,
    error: <>An unexpected error occurred</>,
};

const REWRITING_RESULT_ERROR_MAP: Record<
    RewritingResult['kind'],
    React.ReactElement | null
> = {
    success: null,
    'not-supported': (
        <>
            Rewriter API not available in this browser.{' '}
            <a href="https://developer.chrome.com/docs/ai/rewriter-api#get_started">
                Please enable
            </a>
        </>
    ),
    'no-model-available': <>Rewriter model not available yet</>,
    aborted: <>Rewrite cancelled</>,
    error: <>An unexpected error occurred</>,
};

export default function TextWriter({ onClose }: TextWriterProps) {
    const [inputText, setInputText] = useState('');
    const [sharedContext, setSharedContext] = useState('');
    const [operation, setOperation] = useState<OperationType>('write');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactElement | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const currentEntry = history[currentIndex];

    async function handleOperation() {
        if (!inputText.trim()) {
            alert('Please enter some text');
            return;
        }

        setIsLoading(true);
        try {
            let text = '';

            if (operation === 'write') {
                const result = await writeText(inputText, sharedContext);

                setError(WRITING_RESULT_ERROR_MAP[result.kind]);

                if (result.kind !== 'success') {
                    return;
                }

                text = result.text;
            } else {
                const result = await rewriteText(inputText, sharedContext);

                setError(REWRITING_RESULT_ERROR_MAP[result.kind]);

                if (result.kind !== 'success') {
                    return;
                }

                text = result.text;
            }

            const newEntry: HistoryEntry = {
                input: inputText,
                output: text,
                operation,
                sharedContext,
            };

            setHistory(prev => [...prev, newEntry]);
            setCurrentIndex(history.length);
        } catch (error) {
            console.error('Text operation error:', error);
            alert('Failed to process text. Please try again.');
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

    function getOperationTitle(op: OperationType): string {
        switch (op) {
            case 'write':
                return 'Write';
            case 'rewrite':
                return 'Rewrite';
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
            handleOperation();
        }
    };

    return (
        <Draggable
            storageKey="minerva-text-writer-position"
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
                {/* Operation Selector */}
                <div className={styles.inputGroup}>
                    <div
                        className={styles.buttonGroup}
                        style={{
                            display: 'flex',
                            gap: '0',
                            background: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '12px',
                            padding: '4px',
                        }}
                    >
                        <button
                            onClick={() => setOperation('write')}
                            disabled={isLoading}
                            className={`${styles.button} ${operation === 'write' ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    operation === 'write'
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Write
                        </button>
                        <button
                            onClick={() => setOperation('rewrite')}
                            disabled={isLoading}
                            className={`${styles.button} ${operation === 'rewrite' ? styles.buttonPrimary : styles.buttonSecondary}`}
                            style={{
                                flex: 1,
                                margin: 0,
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                boxShadow:
                                    operation === 'rewrite'
                                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                                        : 'none',
                            }}
                        >
                            Rewrite
                        </button>
                    </div>
                </div>

                {/* Input Text */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Input Text:</label>
                    <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter text here..."
                        rows={4}
                        className={styles.textarea}
                        disabled={isLoading}
                    />
                </div>

                {/* Shared Context for Write/Rewrite */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Context (optional):</label>
                    <textarea
                        value={sharedContext}
                        onChange={e => setSharedContext(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Additional context or instructions..."
                        rows={2}
                        className={styles.textarea}
                        disabled={isLoading}
                    />
                </div>

                {error ? <p className={styles.errorBox}>{error}</p> : null}

                {/* Submit Button */}
                <LoadingButton
                    onClick={handleOperation}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Processing..."
                    idleText={operation === 'write' ? '✍️ Write' : '🔄 Rewrite'}
                    svgPath="icons/gen-loop.svg"
                />

                {/* Result Section with History Navigation */}
                {history.length > 0 && currentEntry && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>⚙️ Operation</div>
                            <div className={styles.cardContent}>
                                {getOperationTitle(currentEntry.operation)}
                            </div>
                        </div>

                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>📥 Input</div>
                            <div className={styles.cardContent}>
                                {currentEntry.input}
                            </div>
                        </div>

                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>📤 Output</div>
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
