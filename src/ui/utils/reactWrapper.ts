import { createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';

export function renderReactComponent<P extends {}, R = any>(
    Component: React.ComponentType<P>,
    props: P,
    onRef?: (ref: R | null) => void
): HTMLElement {
    const container = document.createElement('div');
    const root = createRoot(container);

    if (onRef) {
        const ref = createRef<R>();
        root.render(createElement(Component, { ...props, ref } as any));

        setTimeout(() => onRef(ref.current), 0);
    } else {
        root.render(createElement(Component, props));
    }

    return container;
}
