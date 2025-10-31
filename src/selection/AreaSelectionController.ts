import {
    createSelectionOverlay,
    type SelectionOverlayWrapper,
} from '../ui/molecules';
import { extractTextWithLatex } from './text-extraction';

export interface SelectionBox {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export interface SelectionBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface SelectionResult {
    doc: Document;
    elements: HTMLElement[];
    text: string;
    bounds: SelectionBounds;
}

type SelectionCompleteHandler = (result: SelectionResult) => void;

export class AreaSelectionController {
    #doc: Document;
    #overlay: SelectionOverlayWrapper | null = null;
    #selectionBox: SelectionBox | null = null;
    #isActive = false;
    #handlers: Map<string, EventListener> = new Map();
    #onComplete: SelectionCompleteHandler | null = null;
    #pendingUpdate = false;
    #updateFrameId: number | null = null;

    constructor(doc: Document) {
        this.#doc = doc;
    }

    /**
     * Activate area selection mode
     */
    activate(onComplete: SelectionCompleteHandler): void {
        if (this.#isActive) return;

        this.#isActive = true;
        this.#onComplete = onComplete;
        this.#createOverlay();
        this.#attachListeners();
        const cursorUrl = chrome.runtime.getURL('logo-16.png');
        this.#doc.body.style.cursor = `url("${cursorUrl}") 8 8, crosshair`;
    }

    /**
     * Deactivate area selection mode
     */
    deactivate(): void {
        if (!this.#isActive) return;

        this.#isActive = false;
        this.#removeOverlay();
        this.#detachListeners();
        this.#doc.body.style.cursor = '';
        this.#selectionBox = null;
        this.#onComplete = null;
    }

    /**
     * Check if selection is active
     */
    isActive(): boolean {
        return this.#isActive;
    }

    /**
     * Create the selection overlay with rectangle
     */
    #createOverlay(): void {
        this.#overlay = createSelectionOverlay(this.#doc);
        this.#doc.body.appendChild(this.#overlay.element);
    }

    /**
     * Remove the selection overlay
     */
    #removeOverlay(): void {
        this.#cancelUpdate();
        if (this.#overlay) {
            this.#overlay.remove();
            this.#overlay = null;
        }
    }

    /**
     * Schedule rectangle update
     */
    #scheduleUpdate(): void {
        if (!this.#overlay || !this.#selectionBox) return;
        if (this.#pendingUpdate) return;

        const view = this.#doc.defaultView ?? window;
        if (!view?.requestAnimationFrame) {
            this.#updateRectangle();
            return;
        }

        this.#pendingUpdate = true;
        this.#updateFrameId = view.requestAnimationFrame(() => {
            this.#pendingUpdate = false;
            this.#updateFrameId = null;
            this.#updateRectangle();
        });
    }

    /**
     * Cancel pending update
     */
    #cancelUpdate(): void {
        if (this.#updateFrameId !== null) {
            const view =
                this.#overlay?.element.ownerDocument?.defaultView ?? window;
            view.cancelAnimationFrame(this.#updateFrameId);
            this.#updateFrameId = null;
        }
        this.#pendingUpdate = false;
    }

    /**
     * Update rectangle position and size
     */
    #updateRectangle(): void {
        if (!this.#overlay || !this.#selectionBox) return;

        const left = Math.min(
            this.#selectionBox.startX,
            this.#selectionBox.currentX
        );
        const top = Math.min(
            this.#selectionBox.startY,
            this.#selectionBox.currentY
        );
        const width = Math.abs(
            this.#selectionBox.currentX - this.#selectionBox.startX
        );
        const height = Math.abs(
            this.#selectionBox.currentY - this.#selectionBox.startY
        );

        this.#overlay.updateRectangle({ left, top, width, height });
        this.#overlay.show();
    }

    /**
     * Handle mouse down - start selection
     */
    #handleMouseDown = (e: Event): void => {
        if (!(e instanceof MouseEvent)) return;
        e.preventDefault();
        e.stopPropagation();

        this.#selectionBox = {
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
        };

        if (this.#overlay) {
            this.#overlay.rectangle.hide();
        }
    };

    /**
     * Handle mouse move - update selection
     */
    #handleMouseMove = (e: Event): void => {
        if (!(e instanceof MouseEvent)) return;
        if (!this.#selectionBox) return;

        e.preventDefault();
        e.stopPropagation();

        this.#selectionBox.currentX = e.clientX;
        this.#selectionBox.currentY = e.clientY;

        this.#scheduleUpdate();
    };

    /**
     * Handle mouse up - complete selection
     */
    #handleMouseUp = (e: Event): void => {
        if (!(e instanceof MouseEvent)) return;
        if (!this.#selectionBox) return;

        e.preventDefault();
        e.stopPropagation();

        this.#selectionBox.currentX = e.clientX;
        this.#selectionBox.currentY = e.clientY;

        const bounds = this.#calculateBounds();

        if (
            Math.abs(bounds.right - bounds.left) > 10 &&
            Math.abs(bounds.bottom - bounds.top) > 10
        ) {
            const extraction = this.#extractSelection(bounds);

            this.#removeOverlay();
            const onComplete = this.#onComplete;
            this.deactivate();
            if (onComplete && extraction.elements.length > 0) {
                onComplete({
                    doc: this.#doc,
                    elements: extraction.elements,
                    text: extraction.text,
                    bounds,
                });
            }
        } else {
            this.deactivate();
        }
    };

    /**
     * Calculate selection bounds
     */
    #calculateBounds(): SelectionBounds {
        if (!this.#selectionBox) {
            return { left: 0, top: 0, right: 0, bottom: 0 };
        }

        return {
            left: Math.min(
                this.#selectionBox.startX,
                this.#selectionBox.currentX
            ),
            top: Math.min(
                this.#selectionBox.startY,
                this.#selectionBox.currentY
            ),
            right: Math.max(
                this.#selectionBox.startX,
                this.#selectionBox.currentX
            ),
            bottom: Math.max(
                this.#selectionBox.startY,
                this.#selectionBox.currentY
            ),
        };
    }

    /**
     * Extract elements and text from selection bounds
     */
    #extractSelection(bounds: SelectionBounds): {
        elements: HTMLElement[];
        text: string;
    } {
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
            this.#doc.body.querySelectorAll(
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
                this.#doc.body.querySelectorAll(
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

    /**
     * Attach event listeners
     */
    #attachListeners(): void {
        const mouseDownHandler = this.#handleMouseDown;
        const mouseMoveHandler = this.#handleMouseMove;
        const mouseUpHandler = this.#handleMouseUp;

        this.#doc.addEventListener('mousedown', mouseDownHandler, true);
        this.#doc.addEventListener('mousemove', mouseMoveHandler, true);
        this.#doc.addEventListener('mouseup', mouseUpHandler, true);

        this.#handlers.set('mousedown', mouseDownHandler);
        this.#handlers.set('mousemove', mouseMoveHandler);
        this.#handlers.set('mouseup', mouseUpHandler);
    }

    /**
     * Detach event listeners
     */
    #detachListeners(): void {
        const mouseDownHandler = this.#handlers.get('mousedown');
        const mouseMoveHandler = this.#handlers.get('mousemove');
        const mouseUpHandler = this.#handlers.get('mouseup');

        if (mouseDownHandler) {
            this.#doc.removeEventListener('mousedown', mouseDownHandler, true);
        }
        if (mouseMoveHandler) {
            this.#doc.removeEventListener('mousemove', mouseMoveHandler, true);
        }
        if (mouseUpHandler) {
            this.#doc.removeEventListener('mouseup', mouseUpHandler, true);
        }

        this.#handlers.clear();
    }
}
