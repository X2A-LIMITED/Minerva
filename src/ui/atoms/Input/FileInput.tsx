import React from 'react';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface FileInputProps extends BaseComponentProps {
    accept?: string;
    onChange?: (file: File | null) => void;
    disabled?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({
    accept = 'image/*',
    onChange,
    disabled = false,
    className = '',
    style,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            const file = e.target.files?.[0] || null;
            onChange(file);
        }
    };

    return (
        <input
            type="file"
            className={`minerva-file-input ${className}`.trim()}
            accept={accept}
            disabled={disabled}
            onChange={handleChange}
            style={style}
        />
    );
};
