import React, { useRef, useEffect } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import styles from './Draggable.module.css';
import { extensionStorage } from '../../../utils/extensionStorage';

export interface DraggableProps {
    children: ReactNode;

    storageKey?: string;

    initialPosition?: { x: number; y: number } | 'center';

    style?: CSSProperties;

    className?: string;

    enabled?: boolean;
}

export const Draggable: React.FC<DraggableProps> = ({
    children,
    storageKey,
    initialPosition = 'center',
    style,
    className,
    enabled = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
    });

    useEffect(() => {
        if (!enabled) return;

        const element = containerRef.current;
        if (!element) return;

        const getCenteredPosition = () => {
            const rect = element.getBoundingClientRect();
            const x = (window.innerWidth - rect.width) / 2;
            const y = (window.innerHeight - rect.height) / 2;
            return { x: Math.max(0, x), y: Math.max(0, y) };
        };

        const loadPosition = async () => {
            try {
                if (storageKey) {
                    const position = await extensionStorage.getItem<{
                        x: number;
                        y: number;
                    }>(storageKey);
                    if (position) {
                        element.style.left = `${position.x}px`;
                        element.style.top = `${position.y}px`;
                    } else {
                        if (initialPosition === 'center') {
                            const centered = getCenteredPosition();
                            element.style.left = `${centered.x}px`;
                            element.style.top = `${centered.y}px`;
                        } else {
                            element.style.left = `${initialPosition.x}px`;
                            element.style.top = `${initialPosition.y}px`;
                        }
                    }
                } else {
                    if (initialPosition === 'center') {
                        const centered = getCenteredPosition();
                        element.style.left = `${centered.x}px`;
                        element.style.top = `${centered.y}px`;
                    } else {
                        element.style.left = `${initialPosition.x}px`;
                        element.style.top = `${initialPosition.y}px`;
                    }
                }
            } catch (e) {
                console.warn('Failed to load draggable position:', e);
                if (initialPosition === 'center') {
                    const centered = getCenteredPosition();
                    element.style.left = `${centered.x}px`;
                    element.style.top = `${centered.y}px`;
                } else {
                    element.style.left = `${initialPosition.x}px`;
                    element.style.top = `${initialPosition.y}px`;
                }
            }
        };

        loadPosition();

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'A' ||
                target.tagName === 'SELECT' ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('textarea') ||
                target.closest('a') ||
                target.closest('select') ||
                target.closest('[data-no-drag="true"]')
            ) {
                return;
            }

            const rect = element.getBoundingClientRect();
            dragStateRef.current = {
                isDragging: true,
                startX: e.clientX,
                startY: e.clientY,
                elementX: rect.left,
                elementY: rect.top,
            };

            element.style.cursor = 'grabbing';

            element.classList.add(styles.dragging);
            e.preventDefault();
            e.stopPropagation();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStateRef.current.isDragging) return;

            const deltaX = e.clientX - dragStateRef.current.startX;
            const deltaY = e.clientY - dragStateRef.current.startY;

            const newX = dragStateRef.current.elementX + deltaX;
            const newY = dragStateRef.current.elementY + deltaY;

            const rect = element.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            element.style.transform = `translate(${boundedX - dragStateRef.current.elementX}px, ${boundedY - dragStateRef.current.elementY}px)`;
            element.style.left = `${dragStateRef.current.elementX}px`;
            element.style.top = `${dragStateRef.current.elementY}px`;

            e.preventDefault();
        };

        const handleMouseUp = () => {
            if (!dragStateRef.current.isDragging) return;

            dragStateRef.current.isDragging = false;
            element.style.cursor = 'grab';

            element.classList.remove(styles.dragging);

            const rect = element.getBoundingClientRect();
            element.style.left = `${rect.left}px`;
            element.style.top = `${rect.top}px`;
            element.style.transform = 'translateZ(0)';

            if (storageKey) {
                extensionStorage
                    .setItem(storageKey, {
                        x: rect.left,
                        y: rect.top,
                    })
                    .catch(e => {
                        console.warn('Failed to save draggable position:', e);
                    });
            }
        };

        element.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [enabled, storageKey, initialPosition]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: 'fixed',
                cursor: enabled ? 'grab' : 'default',
                ...style,
            }}
        >
            {children}
        </div>
    );
};
