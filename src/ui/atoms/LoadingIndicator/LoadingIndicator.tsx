import React from 'react';

export interface LoadingIndicatorProps {
    alt?: string;
    className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    alt = 'Loading',
    className = 'minerva-loading-indicator',
}) => {
    return (
        <img
            src={chrome.runtime.getURL('logo-loop.svg')}
            className={className}
            alt={alt}
        />
    );
};
