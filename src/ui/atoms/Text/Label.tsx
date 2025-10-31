import React from 'react';
import styles from './Label.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface LabelProps extends BaseComponentProps {
    text: string;
    htmlFor?: string;
}

export const Label: React.FC<LabelProps> = ({
    text,
    htmlFor,
    className = '',
    style,
}) => {
    return (
        <label
            className={`${styles.label} ${className}`.trim()}
            htmlFor={htmlFor}
            style={style}
        >
            {text}
        </label>
    );
};
