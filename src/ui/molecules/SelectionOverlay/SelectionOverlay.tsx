import React, { useMemo } from 'react';
import { SelectionRectangle, type SelectionRectangleProps } from '../../atoms';
import type { SelectionBounds } from '../../../selection/AreaSelectionController';
import {
    AREA_SELECTION_STATUS,
    type AreaSelectionStatus,
} from '../../../hooks';
import styles from './SelectionOverlay.module.css';

export interface SelectionOverlayHandle {
    show: () => void;
    hide: () => void;
    updateRectangle: (props: SelectionRectangleProps) => void;
    remove: () => void;
}

export interface SelectionOverlayProps {
    status: AreaSelectionStatus;
    selectionBounds: SelectionBounds;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    status,
    selectionBounds: { top, left, bottom, right },
}: SelectionOverlayProps) => {
    const width = useMemo(() => right - left, [left, right]);
    const height = useMemo(() => bottom - top, [top, bottom]);

    const cursorStyle = useMemo(() => {
        if (status === AREA_SELECTION_STATUS.DEACTIVATED) return 'default';

        const cursorUrl = chrome.runtime.getURL('icons/tldr-16.webp');

        return `url("${cursorUrl}") 8 0, crosshair`;
    }, [status]);

    return (
        <div
            className={styles.overlay}
            style={{
                display:
                    status === AREA_SELECTION_STATUS.DEACTIVATED
                        ? 'none'
                        : 'block',
                cursor: cursorStyle,
            }}
        >
            <div
                style={{
                    display:
                        status === AREA_SELECTION_STATUS.SELECTING
                            ? 'block'
                            : 'none',
                }}
            >
                <SelectionRectangle
                    top={top}
                    left={left}
                    width={width}
                    height={height}
                />
            </div>
        </div>
    );
};
