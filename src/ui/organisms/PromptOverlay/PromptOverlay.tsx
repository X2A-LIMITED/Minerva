import React, { createElement, useMemo } from 'react';
import { SearchBar, NavControls } from '../../molecules';
import { Draggable } from '../../atoms';
import { usePromptApi } from '../../../hooks/usePromptApi';
import { extractWebpageContent, convertMarkdownToHtml } from '../../utils';
import type { CustomLanguageModel } from '../../../genAI/languageModel';
import { createRoot, type Root } from 'react-dom/client';
import styles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';

export interface PromptOverlayProps {
    languageModel: CustomLanguageModel;
    initialContext: string;
    onClose: () => void;
    webpageModeEnabled: boolean;
    onToggleWebpage: (enabled: boolean) => void;
    assistantIcon?: string;
    isVisible?: boolean;
}

const WebpageToggle: React.FC<{
    enabled: boolean;
    assistantIcon: string;
    onToggle: (enabled: boolean) => void;
}> = ({ enabled, onToggle }) => {
    return (
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
                onClick={() => onToggle(true)}
                className={`${styles.button} ${enabled ? styles.buttonPrimary : styles.buttonSecondary}`}
                style={{
                    flex: 1,
                    margin: 0,
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    boxShadow: enabled
                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                        : 'none',
                }}
            >
                📄 Ask about this page
            </button>
            <button
                onClick={() => onToggle(false)}
                className={`${styles.button} ${!enabled ? styles.buttonPrimary : styles.buttonSecondary}`}
                style={{
                    flex: 1,
                    margin: 0,
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: !enabled
                        ? '0 2px 8px rgba(0, 123, 255, 0.25)'
                        : 'none',
                }}
            >
                Private Chat
            </button>
        </div>
    );
};

export const PromptOverlay: React.FC<PromptOverlayProps> = ({
    languageModel,
    onClose,
    webpageModeEnabled,
    onToggleWebpage,
    assistantIcon = chrome.runtime.getURL('logo.svg'),
    isVisible = false,
}) => {
    const context = useMemo(
        () => (webpageModeEnabled ? extractWebpageContent() : ''),
        [webpageModeEnabled]
    );
    const {
        history,
        currentIndex,
        submitQuestion,
        navigatePrevious,
        navigateNext,
        copyAnswer,
        isLoading,
    } = usePromptApi({
        languageModel,
        context,
        allowEmptyContext: !webpageModeEnabled,
    });
    const handleToggleWebpage = (enabled: boolean) => {
        onToggleWebpage(enabled);
    };
    const currentEntry = history[currentIndex];
    const currentQuestion = currentEntry?.question || 'Ask your question above';
    const currentAnswer = currentEntry?.answer || '';
    const showCopyButton = !!currentAnswer;
    const showNavControls = history.length > 0;

    const displayIcon = isLoading
        ? chrome.runtime.getURL('logo-loop.svg')
        : assistantIcon;

    if (!isVisible) {
        return null;
    }

    return (
        <Draggable
            storageKey="minerva-prompt-overlay-position"
            initialPosition="center"
            className={styles.container}
        >
            {}
            <button
                className={styles.closeButton}
                onClick={onClose}
                title="Close"
                aria-label="Close"
            >
                ✕
            </button>

            <div className={styles.contentWrapper}>
                {}
                <div className={styles.inputGroup}>
                    <WebpageToggle
                        enabled={webpageModeEnabled}
                        assistantIcon={displayIcon}
                        onToggle={handleToggleWebpage}
                    />
                </div>

                {}
                <div className={styles.inputGroup}>
                    <SearchBar
                        placeholder="Ask a question..."
                        onSubmit={submitQuestion}
                        isLoading={isLoading}
                    />
                </div>

                {}
                {history.length > 0 && (
                    <div className={styles.summarySection}>
                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>❓ Question</div>
                            <div className={styles.cardContent}>
                                {currentQuestion}
                            </div>
                        </div>

                        <div className={styles.resultCard}>
                            <div className={styles.cardLabel}>💬 Answer</div>
                            <div
                                className={styles.cardContent}
                                dangerouslySetInnerHTML={{
                                    __html: convertMarkdownToHtml(
                                        currentAnswer
                                    ),
                                }}
                            />
                            {}
                            {showCopyButton && (
                                <button
                                    className={styles.cardCopyButton}
                                    title="Copy answer"
                                    onClick={copyAnswer}
                                    aria-label="Copy answer"
                                >
                                    📋
                                </button>
                            )}
                            {}
                            {showNavControls && history.length > 1 && (
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
};

export class PromptOverlayController {
    #props: PromptOverlayProps;
    #container: HTMLElement | null;
    #root: Root | null;

    constructor(props: PromptOverlayProps) {
        this.#props = props;
        this.#container = null;
        this.#root = null;
    }

    mount(container: HTMLElement) {
        if (this.#isMounted()) {
            throw new Error('already mounted');
        }

        this.#container = container;
        this.#root = createRoot(container);
    }

    updateProps(props: PromptOverlayProps) {
        if (!this.#isMounted()) {
            throw new Error('no mounted');
        }

        Object.assign(this.#props, props);
        this.#render();
    }

    #render() {
        if (!this.#isMounted()) {
            throw new Error('not mounted');
        }

        this.#root!.render(createElement(PromptOverlay, this.#props));
    }

    #isMounted(): boolean {
        return Boolean(this.#container && this.#root);
    }
}
