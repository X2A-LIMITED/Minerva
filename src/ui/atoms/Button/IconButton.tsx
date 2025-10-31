import React from 'react';
import styles from './IconButton.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface IconButtonProps extends BaseComponentProps {
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    icon: string | React.ReactNode;
    disabled?: boolean;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
    onClick,
    icon,
    disabled = false,
    active = false,
    size = 'md',
    className = '',
    style,
}) => {
    const isEmoji =
        typeof icon === 'string' &&
        !icon.startsWith('http') &&
        !icon.includes('/');

    const containerClassName =
        `${styles.icon} ${styles[`icon--${size}`]} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''} ${className}`.trim();

    const containerStyle: React.CSSProperties = {
        ...style,
        ...(disabled && {
            cursor: 'not-allowed',
            opacity: 0.6,
        }),
        ...(!disabled &&
            onClick && {
                cursor: 'pointer',
            }),
    };

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!disabled && onClick) {
            onClick(event);
        }
    };

    const renderIcon = () => {
        if (isEmoji) {
            return <p className={styles.emoji}>{icon as string}</p>;
        } else if (typeof icon === 'string') {
            return <img src={icon} alt="Icon" />;
        } else {
            return icon;
        }
    };

    return (
        <div
            className={containerClassName}
            style={containerStyle}
            onClick={handleClick}
        >
            {renderIcon()}
        </div>
    );
};
