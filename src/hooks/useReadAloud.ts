import { useCallback, useMemo, useState } from 'react';
import {
    speechGenerateAudioBuffer,
    VOICE_NAME,
    type VoiceName,
} from '../genAI/speechGenerator/speechGenerate';

export const READ_ALOUD_STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    PLAYING: 'playing',
} as const;
export type ReadAloudState =
    (typeof READ_ALOUD_STATE)[keyof typeof READ_ALOUD_STATE];

export type ReadAloudActionOptions = {
    text: string;
    apiKey: string;
    voiceName?: VoiceName;
    additionalInstruction?: string;
};
export type ReadAloudAction = (
    options: ReadAloudActionOptions
) => Promise<void>;

export type UseReadAloudReturns = {
    state: ReadAloudState;
    readAloud: ReadAloudAction;
};

const DEFAULT_VOICE_NAME: VoiceName = VOICE_NAME.ZEPHYR;

export function useReadAloud(): UseReadAloudReturns {
    const [state, setState] = useState<ReadAloudState>(READ_ALOUD_STATE.IDLE);
    const [cache, setCache] = useState<Record<string, AudioBuffer>>({});
    const audioContext = useMemo(() => new AudioContext(), []);
    const textEncoder = useMemo(() => new TextEncoder(), []);
    const readAloud = useCallback(
        async ({
            text,
            apiKey,
            voiceName,
            additionalInstruction,
        }: ReadAloudActionOptions) => {
            if (state !== READ_ALOUD_STATE.IDLE) {
                console.warn('read aloud is not idle');
                return;
            }

            setState(READ_ALOUD_STATE.LOADING);

            const defaultedVoiceName = voiceName ?? DEFAULT_VOICE_NAME;
            const cacheKey = await computeCacheKey(
                [defaultedVoiceName, additionalInstruction ?? '', text],
                textEncoder
            );
            const cachedBuffer = cache[cacheKey];

            if (cachedBuffer) {
                playAudioBuffer(cachedBuffer, audioContext, setState);
                return;
            }

            const audioBuffer = await speechGenerateAudioBuffer(
                apiKey,
                text,
                defaultedVoiceName,
                additionalInstruction,
                audioContext
            );

            playAudioBuffer(audioBuffer, audioContext, setState);
            setCache(previousCache => ({
                ...previousCache,
                [cacheKey]: audioBuffer,
            }));
        },
        [state, setState, cache, setCache, audioContext, textEncoder]
    );

    return {
        state,
        readAloud,
    };
}

async function computeCacheKey(
    values: string[],
    textEncoder: TextEncoder
): Promise<string> {
    const data = values.join('|');
    const encoded = textEncoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-1', encoded);
    const bytes = new Uint8Array(hash);

    return bytes.toBase64();
}

function playAudioBuffer(
    audioBuffer: AudioBuffer,
    audioContext: AudioContext,
    setState: (value: ReadAloudState) => void
): void {
    const audioSource = audioContext.createBufferSource();

    audioSource.buffer = null;
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);
    audioSource.start();
    audioSource.addEventListener(
        'ended',
        () => setState(READ_ALOUD_STATE.IDLE),
        { once: true }
    );
    setState(READ_ALOUD_STATE.PLAYING);
}
