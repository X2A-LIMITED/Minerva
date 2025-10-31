import React, { useState } from 'react';
import { TextInput } from '../../atoms/Input';
import { Button } from '../../atoms/Button';
import styles from './SearchBar.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface SearchBarProps extends BaseComponentProps {
    placeholder?: string;
    onSubmit: (value: string) => void;
    value?: string;
    isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Ask a question...',
    onSubmit,
    value: initialValue = '',
    className = '',
    style,
    isLoading = false,
}) => {
    const [value, setValue] = useState(initialValue);

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={`${styles.controls} ${className}`.trim()} style={style}>
            <TextInput
                placeholder={placeholder}
                value={value}
                className={styles.input}
                onInput={setValue}
                onKeyDown={handleKeyDown}
            />
            <Button
                variant="primary"
                className={styles.send}
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                    padding: '12px',
                    minWidth: 'auto',
                }}
            >
                <img
                    src={chrome.runtime.getURL(
                        isLoading ? 'logo-loop.svg' : 'logo.svg'
                    )}
                    alt="Prompt"
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'block',
                        objectFit: 'contain',
                    }}
                />
            </Button>
        </div>
    );
};
