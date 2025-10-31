import React from 'react';
import { IconButton } from '../../atoms/Button';
import styles from './ControlItem.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface ControlItemProps extends BaseComponentProps {
    icon: string | React.ReactNode;
    label: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    active?: boolean;
}

export const ControlItem: React.FC<ControlItemProps> = ({
    icon,
    label,
    onClick,
    active = false,
    className = '',
    style,
}) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick) {
            onClick(e);
        }
    };

    const labelStyle: React.CSSProperties = {
        cursor: onClick ? 'pointer' : 'default',
    };

    return (
        <div className={`${styles.item} ${className}`.trim()} style={style}>
            <IconButton icon={icon} onClick={onClick} active={active} />
            <span
                className={styles.label}
                style={labelStyle}
                onClick={handleClick}
            >
                {label}
            </span>
        </div>
    );
};
