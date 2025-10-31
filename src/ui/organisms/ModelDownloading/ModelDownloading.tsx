import type React from 'react';
import { Draggable, Logo } from '../../atoms';
import summarizerStyles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';
import styles from './ModelDownloading.module.css';

export type ModelDownloadingProps = {
    downloadProgress: number;
    recheck: () => void;
};

export const ModelDownloading: React.FC<ModelDownloadingProps> = ({
    downloadProgress,
}) => {
    return (
        <Draggable
            storageKey="minerva-model-download-position"
            initialPosition="center"
            className={summarizerStyles.container}
        >
            <div className={summarizerStyles.contentWrapper}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Logo />
                        <p>
                            Minerva is downloading the models locally for your
                            privacy
                        </p>
                    </div>
                    <div className={styles.progressBarContainer}>
                        <div
                            className={styles.progressBarFill}
                            style={{
                                width: `${downloadProgress * 100}%`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </Draggable>
    );
};
