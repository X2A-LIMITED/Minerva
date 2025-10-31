export function extractWebpageContent(): string {
    const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        'body',
    ];

    for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.textContent?.trim() || '';
        }
    }

    return document.body.textContent?.trim() || '';
}
