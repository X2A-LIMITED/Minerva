import React from 'react';
import styles from './SelectionRectangle.module.css';

export interface SelectionRectangleProps {
    left: number;
    top: number;
    width: number;
    height: number;
    shimmer?: boolean;
}

export const SelectionRectangle: React.FC<SelectionRectangleProps> = ({
    top,
    left,
    width,
    height,
    shimmer,
}) => {
    const style: React.CSSProperties = {
        display: 'block',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        ...(shimmer
            ? {
                  border: '2px solid #667eea',
                  background:
                      'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(102, 126, 234, 0.1) 100%)',
                  backgroundSize: '200% 100%',
              }
            : {}),
    };
    const className = shimmer
        ? `${styles.rect} ${styles.shimmer}`
        : styles.rect;

    return <div className={className} style={style} />;
};
