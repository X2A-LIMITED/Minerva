import React from 'react';
import styles from './Logo.module.css';

export interface LogoProps {
    src?: string;
    alt?: string;
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({
    src = chrome.runtime.getURL('logo-loop.svg'),
    alt = 'minerva',
    className = '',
    size,
}) => {
    const style: React.CSSProperties = size
        ? {
              width: `${size}px`,
              height: `${size}px`,
          }
        : {};

    const logoClassName = `${styles.logo} ${className}`.trim();

    return <img className={logoClassName} alt={alt} src={src} style={style} />;
};
