import React, { useEffect, useRef } from 'react';
import { convertMarkdownToHtml, linkifyElement } from '../../utils';
import styles from './SummaryTextWithLinks.module.css';

export interface LinkMapping {
    text: string;
    href: string;
}

export interface SummaryTextWithLinksProps {
    summaryText: string;
    links?: LinkMapping[];
    className?: string;
}

export const SummaryTextWithLinks: React.FC<SummaryTextWithLinksProps> = ({
    summaryText,
    links = [],
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const linkMappings = new Map<string, string>();
            links.forEach(link => {
                linkMappings.set(link.text.toLowerCase(), link.href);
            });

            const convertedHtml = convertMarkdownToHtml(summaryText);
            if (convertedHtml) {
                containerRef.current.innerHTML = convertedHtml;
            } else {
                containerRef.current.textContent = summaryText;
            }

            linkifyElement(
                document,
                containerRef.current,
                linkMappings,
                styles.link
            );
        }
    }, [summaryText, links]);

    return (
        <div
            ref={containerRef}
            className={`${styles.text} ${className}`.trim()}
        />
    );
};
