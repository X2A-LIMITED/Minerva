import React from 'react';
import styles from './ToggleGroup.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface ToggleGroupProps extends BaseComponentProps {
    options: Array<{
        label: string;
        value: string;
    }>;
    selected: string;
    onSelect: (value: string) => void;
    disabled?: boolean;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
    options,
    selected,
    onSelect,
    className = '',
    style,
    disabled = false,
}) => {
    return (
        <div className={`${styles.group} ${className}`.trim()} style={style}>
            {options.map(option => (
                <button
                    key={option.value}
                    className={`${styles.button} ${option.value === selected ? styles.active : ''}`.trim()}
                    data-value={option.value}
                    onClick={() => onSelect(option.value)}
                    disabled={disabled}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};
