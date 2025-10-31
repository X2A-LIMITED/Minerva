export function escapeHtml(input: string): string {
    return input.replace(/[&<>"]/g, char => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            default:
                return char;
        }
    });
}

/**
 * Apply inline markdown formatting (bold, italic, links)
 */
export function applyInlineMarkdown(text: string): string {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return escaped.replace(
        /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" rel="noopener noreferrer">$1</a>'
    );
}

/**
 * Convert markdown text to HTML
 */
export function convertMarkdownToHtml(input: string): string {
    const normalizedInput = input
        .replace(/([:;])\s+([-*+])\s+/g, '$1\n$2 ')
        .replace(/(\r?\n)\s*([-*+])\s+/g, '\n$2 ');

    const lines = normalizedInput.split(/\r?\n/);
    const output: string[] = [];
    let inList = false;

    const openList = () => {
        if (!inList) {
            output.push('<ul>');
            inList = true;
        }
    };

    const closeList = () => {
        if (inList) {
            output.push('</ul>');
            inList = false;
        }
    };

    for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();
        if (trimmedLine.length === 0) {
            closeList();
            continue;
        }

        const bulletMatch = /^([-*+])\s*(.+)$/.exec(trimmedLine);
        const content = bulletMatch ? bulletMatch[2].trim() : trimmedLine;

        let sanitizedContent = content;
        if (
            sanitizedContent.length > 1 &&
            sanitizedContent.startsWith("'") &&
            sanitizedContent.endsWith("'")
        ) {
            sanitizedContent = sanitizedContent.slice(1, -1);
        }

        if (bulletMatch) {
            openList();
            let processedSegments = false;
            let remainder = trimmedLine;
            while (remainder.length > 0) {
                const segmentMatch = /^([-*+])\s*(.+?)(?=(\s+[-*+])|\s*$)/.exec(
                    remainder
                );
                if (!segmentMatch) {
                    break;
                }

                const segmentContent = segmentMatch[2].trim();
                let segmentSanitized = segmentContent;
                if (
                    segmentSanitized.length > 1 &&
                    segmentSanitized.startsWith("'") &&
                    segmentSanitized.endsWith("'")
                ) {
                    segmentSanitized = segmentSanitized.slice(1, -1);
                }

                output.push(
                    `<li>${applyInlineMarkdown(segmentSanitized)}</li>`
                );
                processedSegments = true;
                remainder = remainder.slice(segmentMatch[0].length).trimStart();
            }

            if (!processedSegments) {
                output.push(
                    `<li>${applyInlineMarkdown(sanitizedContent)}</li>`
                );
            }
        } else {
            closeList();
            output.push(`<p>${applyInlineMarkdown(sanitizedContent)}</p>`);
        }
    }

    closeList();

    return output.join('\n');
}

/**
 * Extract inner text from HTML string
 */
export function extractInnerTextFromHTML(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.innerText || temp.textContent || '';
}
