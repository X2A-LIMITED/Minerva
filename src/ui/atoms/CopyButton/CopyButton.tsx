import React, { useState } from 'react';

export interface CopyButtonProps {
    alt?: string;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void | Promise<void>;
    text?: string;
    style?: React.CSSProperties;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
    alt = 'Copy to Clipboard',
    className = 'minerva-copy-button',
    onClick,
    text,
    style,
}) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (onClick) {
            await onClick(e);
        } else if (text) {
            await copyWithAnimation(text);
        }
    };

    const copyWithAnimation = async (textToCopy: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            await animateCopySuccess();
            return true;
        } catch (err) {
            console.error('Failed to copy text:', err);
            return false;
        }
    };

    const animateCopySuccess = async (): Promise<void> => {
        setIsAnimating(true);

        return new Promise(resolve => {
            setTimeout(() => {
                setIsAnimating(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setIsSuccess(false);
                    resolve();
                }, 1500);
            }, 600);
        });
    };

    const getIconSrc = () => {
        if (isSuccess) {
            return chrome.runtime.getURL('check.svg');
        }
        return chrome.runtime.getURL('copy.svg');
    };

    return (
        <img
            src={getIconSrc()}
            alt={alt}
            className={`${className} ${isAnimating ? 'minerva-copy-animate' : ''}`}
            onClick={handleClick}
            style={style}
        />
    );
};

export async function animateCopySuccess(
    copyButton: HTMLImageElement
): Promise<void> {
    copyButton.classList.add('minerva-copy-animate');

    return new Promise(resolve => {
        setTimeout(() => {
            copyButton.classList.remove('minerva-copy-animate');
            copyButton.src = chrome.runtime.getURL('check.svg');

            setTimeout(() => {
                copyButton.src = chrome.runtime.getURL('copy.svg');
                resolve();
            }, 1500);
        }, 600);
    });
}

export async function copyWithAnimation(
    text: string,
    copyButton: HTMLImageElement
): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        await animateCopySuccess(copyButton);
        return true;
    } catch (err) {
        console.error('Failed to copy text:', err);
        return false;
    }
}
