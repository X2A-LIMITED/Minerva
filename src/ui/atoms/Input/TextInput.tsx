import React from 'react';
import styles from './TextInput.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface TextInputProps extends BaseComponentProps {
    value?: string;
    placeholder?: string;
    onInput?: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
    value = '',
    placeholder = '',
    onInput,
    onKeyDown,
    onFocus,
    onBlur,
    disabled = false,
    className = '',
    style,
}) => {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onInput) {
            onInput(e.target.value);
        }
    };

    return (
        <input
            type="text"
            className={`${styles.input} ${className}`.trim()}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInput}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            style={style}
        />
    );
};
