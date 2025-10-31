import type React from 'react';
import {
    READ_ALOUD_STATE,
    useReadAloud,
    type ReadAloudState,
} from '../../../hooks/useReadAloud';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ReadAloudButton.module.css';
import type { VoiceName } from '../../../genAI/speechGenerator/speechGenerate';
import { SettingsContext, useContextNotNull } from '../../../contexts';

export type ReadAloudButtonProps = {
    text: string;
    requestApiKey: () => void;
    voiceName?: VoiceName;
    additionalInstruction?: string;
};

const STYLING_BY_STATE: Record<
    ReadAloudState,
    { icon: string; shimmering?: boolean }
> = {
    [READ_ALOUD_STATE.IDLE]: {
        icon: chrome.runtime.getURL('icons/audio.svg'),
    },
    [READ_ALOUD_STATE.LOADING]: {
        icon: chrome.runtime.getURL('icons/audio.svg'),
        shimmering: true,
    },
    [READ_ALOUD_STATE.PLAYING]: {
        icon: chrome.runtime.getURL('icons/audio-playing.svg'),
    },
};

export const ReadAloudButton: React.FunctionComponent<ReadAloudButtonProps> = ({
    text,
    requestApiKey,
    voiceName,
    additionalInstruction,
}: ReadAloudButtonProps) => {
    const { apiKey } = useContextNotNull(SettingsContext);
    const { state: readAloudState, readAloud } = useReadAloud();
    const [isWaitingApiKey, setIsWaitingApiKey] = useState<boolean>(false);
    const handleClick = useCallback(() => {
        if (!apiKey) {
            setIsWaitingApiKey(true);
            requestApiKey();
            return;
        }
        readAloud({ text, apiKey, voiceName, additionalInstruction });
    }, [
        readAloud,
        requestApiKey,
        text,
        apiKey,
        voiceName,
        additionalInstruction,
    ]);
    const styling = useMemo(
        () => STYLING_BY_STATE[readAloudState],
        [readAloudState]
    );

    useEffect(() => {
        if (isWaitingApiKey && apiKey) {
            setIsWaitingApiKey(false);
            handleClick();
        }
    }, [apiKey, isWaitingApiKey, handleClick]);

    return (
        <a className={`${styles.button}`} onClick={handleClick}>
            <img className={styles.image} src={styling.icon} />
            {styling.shimmering ? (
                <div className={styles.shimmering}></div>
            ) : null}
        </a>
    );
};
