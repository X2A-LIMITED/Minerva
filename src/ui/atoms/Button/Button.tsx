import React from 'react';
import styles from './Button.module.css';

interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface ButtonProps extends BaseComponentProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
    title?: string;
}

export const Button: React.FC<ButtonProps> = ({
    onClick,
    disabled = false,
    variant = 'secondary',
    size = 'md',
    className = '',
    style,
    children,
    title,
}) => {
    const buttonClassName =
        `${styles.button} ${styles[`button--${variant}`]} ${styles[`button--${size}`]} ${className}`.trim();

    return (
        <button
            className={buttonClassName}
            disabled={disabled}
            onClick={onClick}
            style={style}
            title={title}
        >
            {children}
        </button>
    );
};
