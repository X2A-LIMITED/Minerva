import React from 'react';
import { ToggleSwitch } from '../../atoms/Toggle';
import styles from './ControlItemWithToggle.module.css';

export interface ControlItemWithToggleProps {
    label: string;
    active?: boolean;
    onToggle: (active: boolean) => void;
    onLabelClick?: () => void;
    className?: string;
}

export const ControlItemWithToggle: React.FC<ControlItemWithToggleProps> = ({
    label,
    active = false,
    onToggle,
    onLabelClick,
    className = '',
}) => {
    const labelStyle: React.CSSProperties = {
        cursor: onLabelClick ? 'pointer' : 'default',
    };

    return (
        <div className={`${styles.item} ${className}`.trim()}>
            <div className={styles.icon}>
                <ToggleSwitch
                    active={active}
                    onToggle={onToggle}
                    className={styles.toggle}
                />
            </div>
            <span
                className={styles.label}
                style={labelStyle}
                onClick={onLabelClick}
            >
                {label}
            </span>
        </div>
    );
};
