import React from 'react';
import styles from './ToggleSwitch.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface ToggleSwitchProps extends BaseComponentProps {
    active: boolean;
    onToggle: (active: boolean) => void;
    disabled?: boolean;
    label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    active,
    onToggle,
    disabled = false,
    label,
    className = '',
    style,
}) => {
    const handleClick = () => {
        if (!disabled) {
            onToggle(!active);
        }
    };

    if (label) {
        const containerClassName =
            `${styles.toggle} ${disabled ? styles.disabled : ''} ${className}`.trim();
        const containerStyle: React.CSSProperties = {
            ...style,
            cursor: disabled ? 'default' : 'pointer',
        };

        return (
            <div
                className={containerClassName}
                style={containerStyle}
                onClick={handleClick}
            >
                <span className={styles.label}>{label}</span>
                <div
                    className={`${styles.switch} ${active ? styles.active : ''}`}
                >
                    <div className={styles.thumb} />
                </div>
            </div>
        );
    }

    const toggleClassName =
        `${styles.switch} ${active ? styles.active : ''} ${className}`.trim();

    return (
        <div className={toggleClassName} style={style} onClick={handleClick}>
            <div className={styles.thumb} />
        </div>
    );
};
