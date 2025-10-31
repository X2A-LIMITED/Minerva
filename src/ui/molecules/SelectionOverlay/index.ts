export * from './SelectionOverlay';

export interface SelectionOverlayWrapper {
    element: HTMLElement;
    show: () => void;
    hide: () => void;
    updateRectangle: (props: any) => void;
    remove: () => void;
    rectangle: {
        hide: () => void;
    };
}

export function createSelectionOverlay(
    _doc: Document
): SelectionOverlayWrapper {
    return {} as any;
}
