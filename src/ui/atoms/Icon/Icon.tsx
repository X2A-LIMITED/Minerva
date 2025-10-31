import React from 'react';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface IconProps extends BaseComponentProps {
    src?: string;
    emoji?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Icon: React.FC<IconProps> = ({
    src,
    emoji,
    size = 'md',
    className = '',
    style,
}) => {
    if (emoji) {
        return (
            <span
                className={`minerva-icon minerva-icon--emoji minerva-icon--${size} ${className}`.trim()}
                style={style}
            >
                {emoji}
            </span>
        );
    }

    if (src) {
        return (
            <img
                className={`minerva-icon minerva-icon--image minerva-icon--${size} ${className}`.trim()}
                src={src}
                alt="Icon"
                style={style}
            />
        );
    }

    return (
        <span
            className={`minerva-icon minerva-icon--${size} ${className}`.trim()}
            style={style}
        />
    );
};
