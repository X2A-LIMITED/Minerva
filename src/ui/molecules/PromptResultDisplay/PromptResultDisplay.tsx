import React, { useMemo } from 'react';
import { CopyButton } from '../../atoms';
import { NavControls } from '../NavControls';
import { convertMarkdownToHtml } from '../../utils';
import styles from './PromptResultDisplay.module.css';

export interface PromptResultDisplayProps {
    question: string;
    answer: string;
    currentIndex: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
    onCopy?: () => void;
    onQuestionClick?: () => void;
}

export const PromptResultDisplay: React.FC<PromptResultDisplayProps> = ({
    question,
    answer,
    currentIndex,
    total,
    onPrevious = () => {},
    onNext = () => {},
    onCopy,
    onQuestionClick,
}) => {
    const showCopyButton = answer.trim() !== '';
    const showNavControls = total > 1;
    const formattedAnswer = useMemo(
        () => convertMarkdownToHtml(answer),
        [answer]
    );

    const handleQuestionRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuestionClick) {
            onQuestionClick();
        }
    };

    return (
        <div className={styles.result}>
            <div
                className={styles.questionRow}
                onClick={handleQuestionRowClick}
            >
                <CopyButton
                    className={styles.copyButton}
                    onClick={onCopy}
                    style={{ display: showCopyButton ? 'block' : 'none' }}
                />
                <NavControls
                    currentIndex={currentIndex}
                    total={total}
                    onPrevious={onPrevious}
                    onNext={onNext}
                    variant="inlineDark"
                    style={{
                        display: showNavControls ? 'inline-flex' : 'none',
                    }}
                />
                <div className={styles.question}>{question}</div>
            </div>
            <div
                className={styles.answer}
                dangerouslySetInnerHTML={{ __html: formattedAnswer }}
            />
        </div>
    );
};
