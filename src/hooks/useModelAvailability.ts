import { useCallback, useEffect, useState } from 'react';
import { MODEL_AVAILABILITY, type ModelAvailability } from '../genAI/common';

export type UseModelAvailabilityReturns = {
    modelAvailability: ModelAvailability;
    downloadProgress: number;
    recheck: () => void;
};

export function useModelAvailability(): UseModelAvailabilityReturns {
    const [modelAvailability, setModelAvailability] =
        useState<ModelAvailability>(MODEL_AVAILABILITY.MAYBE);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    const recheck = useCallback(async () => {
        const Summarizer = window.Summarizer;

        if (!Summarizer) {
            setModelAvailability(MODEL_AVAILABILITY.UNAVAILABLE);
            return;
        }

        const availability =
            (await Summarizer?.availability({
                outputLanguage: 'en',
            })) ?? MODEL_AVAILABILITY.MAYBE;

        setModelAvailability(availability);

        if (
            !(
                availability === MODEL_AVAILABILITY.DOWNLOADABLE ||
                availability === MODEL_AVAILABILITY.DOWNLOADING
            )
        ) {
            return;
        }

        await Summarizer.create({
            outputLanguage: 'en',
            monitor: monitor => {
                monitor.addEventListener('downloadprogress', evt => {
                    setDownloadProgress(evt.loaded);
                });
            },
        });

        recheck();
    }, []);

    useEffect(() => {
        recheck();
    }, []);

    return {
        modelAvailability,
        downloadProgress,
        recheck,
    };
}
