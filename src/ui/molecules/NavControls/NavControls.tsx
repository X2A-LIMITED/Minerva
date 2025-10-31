import React from 'react';
import styles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface NavControlsProps extends BaseComponentProps {
    currentIndex: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
    variant?: 'default' | 'inlineDark';
}

export const NavControls: React.FC<NavControlsProps> = ({
    currentIndex,
    total,
    onPrevious,
    onNext,
    className = '',
    style,
    variant = 'default',
}) => {
    const containerClass =
        variant === 'inlineDark'
            ? styles.navControlsInlineDark
            : styles.navControls;
    const buttonClass =
        variant === 'inlineDark'
            ? styles.navButtonInlineDark
            : styles.navButton;
    const positionClass =
        variant === 'inlineDark'
            ? styles.navPositionInlineDark
            : styles.navPosition;

    const containerClassName = [containerClass, className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClassName} style={style}>
            <button
                className={buttonClass}
                disabled={currentIndex === 0}
                onClick={onPrevious}
            >
                ←
            </button>
            <span className={positionClass}>
                {currentIndex + 1}/{total}
            </span>
            <button
                className={buttonClass}
                disabled={currentIndex === total - 1}
                onClick={onNext}
            >
                →
            </button>
        </div>
    );
};
