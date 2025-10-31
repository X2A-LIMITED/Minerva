import type { ControlBarPosition } from './localStorage';
import { saveControlBarPosition } from './localStorage';

interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    elementX: number;
    elementY: number;
}

export function makeDraggable(
    element: HTMLElement,
    options: {
        onDragStart?: () => void;
        onDragEnd?: (position: ControlBarPosition) => void;
        savePosition?: boolean;
    } = {}
): () => void {
    const { onDragStart, onDragEnd, savePosition = true } = options;

    const dragState: DragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
    };

    const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'LABEL' ||
            target.tagName === 'TEXTAREA' ||
            target.closest('button') ||
            target.closest('input') ||
            target.closest('label') ||
            target.closest('textarea') ||
            target.closest('.minerva-control-item') ||
            target.closest('.minerva-auto-expand') ||
            target.closest('.minerva-assistant-expand') ||
            target.closest('.minerva-auto-provider')
        ) {
            return;
        }

        dragState.isDragging = true;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;

        const rect = element.getBoundingClientRect();
        dragState.elementX = rect.left;
        dragState.elementY = rect.top;

        element.classList.add('dragging');
        onDragStart?.();

        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragState.isDragging) return;

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        const newX = dragState.elementX + deltaX;
        const newY = dragState.elementY + deltaY;

        const rect = element.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        element.style.left = `${boundedX}px`;
        element.style.top = `${boundedY}px`;
        element.style.transform = 'none';

        e.preventDefault();
    };

    const handleMouseUp = () => {
        if (!dragState.isDragging) return;

        dragState.isDragging = false;
        element.classList.remove('dragging');

        const rect = element.getBoundingClientRect();
        const position: ControlBarPosition = {
            x: rect.left,
            y: rect.top,
        };

        if (savePosition) {
            saveControlBarPosition(position);
        }

        onDragEnd?.(position);
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
}
