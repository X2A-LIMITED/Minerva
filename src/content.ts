import './content.css';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Overlay } from './ui/templates';

class ContentOrchestrator {
    private initialized = false;

    init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        this.injectPageScript();
    }

    private injectPageScript(): void {
        const script = document.createElement('script');
        script.id = 'minerva-page-script';
        script.src = chrome.runtime.getURL('page-script.js');

        const target = document.head || document.documentElement;
        target.appendChild(script);

        script.onload = () => {
            script.remove();
        };

        script.onerror = error => {
            console.error(
                '[Content Script] Failed to load page script:',
                error
            );
        };

        const container = document.createElement('div');

        container.id = 'minerva-overlay-root';
        document.body.appendChild(container);

        const root = createRoot(container);

        root.render(createElement(Overlay));
    }
}

const orchestrator = new ContentOrchestrator();

if (document.readyState === 'complete') {
    orchestrator.init();
} else {
    window.addEventListener('load', () => orchestrator.init(), { once: true });
}
