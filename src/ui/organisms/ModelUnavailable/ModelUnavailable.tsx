import type React from 'react';
import { Draggable } from '../../atoms';
import summarizerStyles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';

export const ModelUnavailable: React.FC<unknown> = () => {
    return (
        <Draggable
            storageKey="minerva-model-download-position"
            initialPosition="center"
            className={summarizerStyles.container}
        >
            <div className={summarizerStyles.contentWrapper}>
                <p>Minerva is not supported in this browser.</p>
            </div>
        </Draggable>
    );
};
