import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    SelectionBounds,
    SelectionBox,
    SelectionResult,
} from '../selection/AreaSelectionController';
import { extractTextWithLatex } from '../selection/text-extraction';

export const AREA_SELECTION_STATUS = {
    DEACTIVATED: 'deactivated',
    WAITING_START: 'waiting-start',
    SELECTING: 'selecting',
} as const;
export type AreaSelectionStatus =
    (typeof AREA_SELECTION_STATUS)[keyof typeof AREA_SELECTION_STATUS];

export type UseAreaSelectionProps = {
    onAreaSelect?: (selection: SelectionResult) => void;
};

export type UseAreaSelectionReturns = {
    status: AreaSelectionStatus;
    activate: () => Promise<SelectionResult>;
    deactivate: () => void;
    selectionBounds: SelectionBounds;
};

export function useAreaSelection({
    onAreaSelect,
}: UseAreaSelectionProps): UseAreaSelectionReturns {
    const [status, setStatus] = useState<AreaSelectionStatus>(
        AREA_SELECTION_STATUS.DEACTIVATED
    );
    const [listeners, setListeners] = useState(
        new Map<
            Promise<SelectionResult>,
            [(value: SelectionResult) => void, (reason: string) => void]
        >()
    );
    const [selectionBox, setSelectionBox] = useState<SelectionBox>({
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
    });
    const selectionBounds = useMemo<SelectionBounds>(() => {
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const bottom = Math.max(selectionBox.startY, selectionBox.currentY);
        const right = Math.max(selectionBox.startX, selectionBox.currentX);

        return {
            top,
            left,
            bottom,
            right,
        };
    }, [selectionBox]);
    const activate = useCallback(() => {
        let resolve: (value: SelectionResult) => void;
        let reject: (reason: string) => void;
        const promise = new Promise<SelectionResult>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        setListeners(
            previousListeners =>
                new Map([
                    ...previousListeners.entries(),
                    [promise, [resolve, reject]],
                ])
        );

        if (status === AREA_SELECTION_STATUS.DEACTIVATED) {
            setStatus(AREA_SELECTION_STATUS.WAITING_START);
        }

        return promise;
    }, [status]);
    const deactivate = useCallback(() => {
        if (status === AREA_SELECTION_STATUS.DEACTIVATED) {
            return;
        }

        setListeners(new Map());
        setStatus(AREA_SELECTION_STATUS.DEACTIVATED);

        for (const [, [, reject]] of listeners) {
            reject('deactivated');
        }
    }, [status, listeners]);
    const onMouseDown = useCallback((evt: Event) => {
        if (!(evt instanceof MouseEvent)) return;

        evt.preventDefault();
        evt.stopPropagation();

        setStatus(AREA_SELECTION_STATUS.SELECTING);
        setSelectionBox({
            startX: evt.clientX,
            startY: evt.clientY,
            currentX: evt.clientX,
            currentY: evt.clientY,
        });
    }, []);
    const onMouseMove = useCallback((evt: Event): void => {
        if (!(evt instanceof MouseEvent)) return;

        evt.preventDefault();
        evt.stopPropagation();

        setSelectionBox(previous => ({
            ...previous,
            currentX: evt.clientX,
            currentY: evt.clientY,
        }));
    }, []);
    const onMouseUp = useCallback(
        (evt: Event): void => {
            if (!(evt instanceof MouseEvent)) return;

            evt.preventDefault();
            evt.stopPropagation();

            const area = Math.abs(
                (selectionBounds.right - selectionBounds.left) *
                    (selectionBounds.bottom - selectionBounds.top)
            );

            if (area < 100) {
                deactivate();
                return;
            }

            setListeners(new Map());
            setStatus(AREA_SELECTION_STATUS.DEACTIVATED);

            const extraction = extractSelection(selectionBounds);
            const result = {
                doc: document,
                elements: extraction.elements,
                text: extraction.text,
                bounds: selectionBounds,
            };

            onAreaSelect?.(result);

            for (const [, [resolve]] of listeners) {
                resolve(result);
            }
        },
        [deactivate, listeners, selectionBounds, onAreaSelect]
    );

    useEffect(() => {
        if (status === AREA_SELECTION_STATUS.DEACTIVATED) {
            return;
        }

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [status, onMouseDown, onMouseMove, onMouseUp]);

    return {
        status,
        activate,
        deactivate,
        selectionBounds,
    };
}

function extractSelection(bounds: SelectionBounds) {
    const containerElements: HTMLElement[] = [];
    const inlineElements: HTMLElement[] = [];
    const rectCache = new Map<Element, DOMRect | DOMRectReadOnly>();

    const measureRect = (element: Element): DOMRect | DOMRectReadOnly => {
        let rect = rectCache.get(element);
        if (!rect) {
            rect = element.getBoundingClientRect();
            rectCache.set(element, rect);
        }
        return rect;
    };

    const containers = Array.from(
        document.body.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre, div.ltx_para, div.ltx_p, div[dir]:not(:has(div[dir])):not(:has(p)):not(:has(h1)):not(:has(h2)):not(:has(h3))'
        )
    );

    for (const element of containers) {
        const rect = measureRect(element);
        const elementCenterX = (rect.left + rect.right) / 2;
        const elementCenterY = (rect.top + rect.bottom) / 2;

        const isCenterInside =
            elementCenterX >= bounds.left &&
            elementCenterX <= bounds.right &&
            elementCenterY >= bounds.top &&
            elementCenterY <= bounds.bottom;

        const overlapLeft = Math.max(bounds.left, rect.left);
        const overlapRight = Math.min(bounds.right, rect.right);
        const overlapTop = Math.max(bounds.top, rect.top);
        const overlapBottom = Math.min(bounds.bottom, rect.bottom);

        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        const overlapArea = overlapWidth * overlapHeight;

        const elementArea = rect.width * rect.height;
        const overlapPercentage =
            elementArea > 0 ? overlapArea / elementArea : 0;

        const hasChildrenInSelection = Array.from(
            element.querySelectorAll('*')
        ).some(child => {
            const childRect = measureRect(child);
            const childCenterX = (childRect.left + childRect.right) / 2;
            const childCenterY = (childRect.top + childRect.bottom) / 2;

            return (
                childCenterX >= bounds.left &&
                childCenterX <= bounds.right &&
                childCenterY >= bounds.top &&
                childCenterY <= bounds.bottom
            );
        });

        if (
            (isCenterInside ||
                overlapPercentage > 0.2 ||
                hasChildrenInSelection) &&
            element.textContent &&
            element.textContent.trim().length > 5
        ) {
            containerElements.push(element as HTMLElement);
        }
    }

    if (containerElements.length === 0) {
        const inlines = Array.from(
            document.body.querySelectorAll(
                'span, a, strong, em, code, .ltx_Math, math'
            )
        );

        for (const element of inlines) {
            const rect = measureRect(element);
            const elementCenterX = (rect.left + rect.right) / 2;
            const elementCenterY = (rect.top + rect.bottom) / 2;

            const isCenterInside =
                elementCenterX >= bounds.left &&
                elementCenterX <= bounds.right &&
                elementCenterY >= bounds.top &&
                elementCenterY <= bounds.bottom;

            if (
                isCenterInside &&
                element.textContent &&
                element.textContent.trim().length > 0
            ) {
                inlineElements.push(element as HTMLElement);
            }
        }
    }

    const selectedElements =
        containerElements.length > 0 ? containerElements : inlineElements;

    const sortedElements = [...selectedElements].sort((a, b) => {
        const rectA = measureRect(a);
        const rectB = measureRect(b);
        if (Math.abs(rectA.top - rectB.top) > 5) {
            return rectA.top - rectB.top;
        }
        return rectA.left - rectB.left;
    });

    let extractedText = '';
    const processedElements = new Set<HTMLElement>();

    for (const element of sortedElements) {
        if (processedElements.has(element)) continue;

        const tagName = element.tagName.toLowerCase();
        if (tagName === 'button' || tagName === 'input') continue;

        let isChildOfProcessed = false;
        for (const processed of processedElements) {
            if (processed.contains(element)) {
                isChildOfProcessed = true;
                break;
            }
        }
        if (isChildOfProcessed) continue;

        let hasParentInSelection = false;
        for (const other of sortedElements) {
            if (other !== element && other.contains(element)) {
                hasParentInSelection = true;
                break;
            }
        }
        if (hasParentInSelection) continue;

        const text = extractTextWithLatex(element);

        if (text && text.length > 0) {
            extractedText += text + '\n\n';
            processedElements.add(element);
        }
    }

    return {
        elements: Array.from(processedElements),
        text: extractedText.trim(),
    };
}
