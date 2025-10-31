import React from 'react';

export interface UndoButtonProps {
    alt?: string;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
    alt = 'Undo',
    className = 'minerva-undo-button',
    onClick,
}) => {
    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <img
            src={chrome.runtime.getURL('undo.svg')}
            alt={alt}
            className={className}
            onClick={handleClick}
        />
    );
};
