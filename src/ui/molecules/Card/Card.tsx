import React from 'react';
import styles from './Card.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface CardProps extends BaseComponentProps {
    icon: string | React.ReactNode;
    name: string;
    selected?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({
    icon,
    name,
    selected = false,
    onClick,
    className = '',
    style,
}) => {
    const cardClassName =
        `${styles.card} ${selected ? styles.selected : ''} ${className}`.trim();

    const isEmoji =
        typeof icon === 'string' &&
        !icon.startsWith('http') &&
        !icon.includes('/');

    const renderIcon = () => {
        if (isEmoji) {
            return icon as string;
        } else if (typeof icon === 'string') {
            return <img src={icon} alt={name} />;
        } else {
            return icon;
        }
    };

    const cardStyle: React.CSSProperties = {
        ...style,
        ...(onClick && { cursor: 'pointer' }),
    };

    return (
        <div className={cardClassName} style={cardStyle} onClick={onClick}>
            <div className={styles.icon}>{renderIcon()}</div>
            <div className={styles.name}>{name}</div>
        </div>
    );
};
