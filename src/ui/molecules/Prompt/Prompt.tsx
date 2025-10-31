import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { TextInput } from '../../atoms';
import { PromptResultDisplay } from '../PromptResultDisplay';
import { usePromptHistory } from '../../../hooks';
import type { CustomLanguageModel } from '../../../genAI/languageModel';
import styles from './Prompt.module.css';

export interface PromptProps {
    languageModel: CustomLanguageModel;
    originalText: string;
    showInput?: boolean;
}

export interface PromptHandle {
    showInput: () => void;
    hideInput: () => void;
}

export const Prompt = forwardRef<PromptHandle, PromptProps>(
    (
        { languageModel, originalText, showInput: initialShowInput = false },
        ref
    ) => {
        const [promptInputVisible, setPromptInputVisible] =
            useState(initialShowInput);
        const [promptValue, setPromptValue] = useState('');

        const {
            promptHistory,
            currentIndex: promptIndex,
            submitQuestion,
            navigatePrevious,
            navigateNext,
            copyAnswer,
        } = usePromptHistory({
            languageModel,
            originalText,
        });

        const handlePromptSubmit = () => {
            if (promptValue.trim()) {
                submitQuestion(promptValue.trim());
                setPromptValue('');
            }
        };

        const handlePromptKeyDown = (
            e: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handlePromptSubmit();
            }
        };

        const showPromptInput = () => {
            setPromptInputVisible(true);
        };

        const hidePromptInput = () => {
            setPromptInputVisible(false);
        };

        useImperativeHandle(ref, () => ({
            showInput: showPromptInput,
            hideInput: hidePromptInput,
        }));

        const currentPromptEntry = promptHistory[promptIndex];
        const showPromptDisplay =
            currentPromptEntry &&
            currentPromptEntry.answer !== undefined &&
            promptHistory.length > 0;

        return (
            <>
                {}
                <div
                    className={styles.controls}
                    style={{ display: promptInputVisible ? 'flex' : 'none' }}
                >
                    <TextInput
                        placeholder="Ask a question about the original text..."
                        className={styles.input}
                        value={promptValue}
                        onInput={setPromptValue}
                        onKeyDown={handlePromptKeyDown}
                    />
                    <button
                        className={styles.send}
                        onClick={handlePromptSubmit}
                    >
                        Send
                    </button>
                </div>

                {}
                {showPromptDisplay && (
                    <PromptResultDisplay
                        question={currentPromptEntry.question}
                        answer={currentPromptEntry.answer}
                        currentIndex={promptIndex}
                        total={promptHistory.length}
                        onPrevious={navigatePrevious}
                        onNext={navigateNext}
                        onCopy={copyAnswer}
                        onQuestionClick={showPromptInput}
                    />
                )}
            </>
        );
    }
);

Prompt.displayName = 'Prompt';
