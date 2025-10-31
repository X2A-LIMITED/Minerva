import type { SummarizerConfig } from './genAI/summarizer/summarizeAPI.ts';

export const DEFAULT_SUMMARIZER_CONFIG: SummarizerConfig = {
    type: 'key-points' as const,
    length: 'medium' as const,
};

export const RGB_COLOR_PATTERN = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
export const LIGHT_COLOR_THRESHOLD = 200;

export const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export const CONTENT_SELECTORS = [
    'main',
    'article',
    '[role="main"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.rich-text',
    '.fig-main-content',
    '.article__content',
    '.fig-content-body',
    '[data-testid="ArticleBody"]',
    '.t-content',
    '.c-article-content',
    'd-article',
    '.mw-parser-output',
    '.devsite-article-body',
    '.ltx_page_content',
    '.ltx_page_main',
    'article.ltx_document',
    '.gr-prose',
    '.gradio-container .contain',
    'gradio-app',
    '.gr-box',
    '.gr-panel',
    '#question',
    '.question',
    '.s-prose',
    '.post-text',
    '#answers .answer',
    '.js-discussion',
    '.comment-body',
    '.timeline-comment',
    '[data-hpc]',
    '[data-test-id="post-content"]',
    'shreddit-post',
    'shreddit-post-text-body',
    '[slot="text-body"]',
    '[data-post-click-location="text-body"]',
    '.Post',
].join(', ');

export const EXCLUDED_CONTAINER_CLASSES = new Set([
    'bandeau-container',
    'ambox',
    'hatnote',
    'infobox',
    'navbox',
    'noprint',
    'nomobile',
    'navigation',
    'sidebar',
    'toc',
]);

export const EXCLUDED_CLASSES = new Set([
    'fig-standfirst',
    'fig-ranking-profile-standfirst',
    'summary',
    'teaser',
    'standfirst',
]);
