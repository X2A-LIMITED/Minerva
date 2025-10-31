import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AREA_SELECTION_STATUS,
    useAreaSelection,
    useClipboard,
    useModelAvailability,
    usePromptOverlay,
} from '../../../hooks';
import { SelectionOverlay, type LinkMapping } from '../../molecules';
import {
    ControlBar,
    InlineSummary,
    ModelDownloading,
    ModelUnavailable,
    PromptOverlay,
} from '../../organisms';
import type { SelectionResult } from '../../../selection/AreaSelectionController';
import { createPortal } from 'react-dom';
import {
    ClientSummarizer,
    type CustomSummarizer,
} from '../../../genAI/summarizer/summarizeAPI';
import {
    ClientRewriter,
    type CustomRewriter,
} from '../../../genAI/textGenerator/rewriter';
import {
    ClientLanguageModel,
    type CustomLanguageModel,
} from '../../../genAI/languageModel';
import { ApiKeyDialog } from '../../atoms';
import {
    DefaultSettings,
    SettingsContext,
    SettingsDispatchContext,
    settingsReducer,
} from '../../../contexts/settings';
import { useLocalStorageReducer } from '../../../hooks/useLocalStorage';
import {
    startAutoSummary,
    stopAutoSummary,
} from '../../../services/autoSummaryService';
import styles from './Overlay.module.css';
import { MODEL_AVAILABILITY } from '../../../genAI/common';

export const Overlay: React.FC<unknown> = () => {
    const { modelAvailability, downloadProgress, recheck } =
        useModelAvailability();
    const [settings, dispatch] = useLocalStorageReducer(
        'minerva-settings',
        settingsReducer,
        DefaultSettings,
        ['apiKey']
    );
    const { copy } = useClipboard();
    const summarizer = useMemo(() => new ClientSummarizer(), []);
    const rewriter = useMemo(() => new ClientRewriter(), []);
    const languageModel = useMemo(() => new ClientLanguageModel(), []);
    const {
        isActive: isPromptOverlayActive,
        isWebpageModeEnabled,
        open: openPromptOverlay,
        close: closePromptOverlay,
        toggleIsWebpageModeEnabled,
    } = usePromptOverlay({});
    const [selections, setSelections] = useState<
        Record<string, SelectionPortalBaseProps>
    >({});
    const [summaryCompletionCallbacks, setSummaryCompletionCallbacks] =
        useState<Record<string, () => void>>({});
    const onAreaSelect = useCallback(async (result: SelectionResult) => {
        const firstElement = result.elements[0];
        const parent = firstElement?.parentElement;

        if (!firstElement || !parent) {
            return;
        }

        for (const element of result.elements) {
            element.style.display = 'none';
        }

        const key = await computeKey(result);
        const portalContainer = document.createElement('div');
        const links = extractLinks(result.elements);

        const summaryCompletePromise = new Promise<void>(resolve => {
            setSummaryCompletionCallbacks(prev => ({
                ...prev,
                [key]: resolve,
            }));
        });

        parent.insertBefore(portalContainer, result.elements[0]);
        setSelections(previous => ({
            ...previous,
            [key]: {
                portalContainer,
                selectionResult: result,
                links,
            },
        }));

        await summaryCompletePromise;
    }, []);
    const handleSummaryComplete = useCallback(
        (key: string) => {
            const callback = summaryCompletionCallbacks[key];
            if (callback) {
                callback();
                setSummaryCompletionCallbacks(prev => {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                });
            }
        },
        [summaryCompletionCallbacks]
    );
    const onUndo = useCallback(
        (key: string) => {
            const selection = selections[key];

            if (!selection) {
                return;
            }

            for (const element of selection.selectionResult.elements) {
                element.style.display = '';
            }

            selection.portalContainer.parentElement?.removeChild(
                selection.portalContainer
            );
            setSelections(previous => {
                const { [key]: _, ...rest } = previous;

                return rest;
            });
        },
        [selections]
    );
    const { status, activate, deactivate, selectionBounds } = useAreaSelection({
        onAreaSelect,
    });
    const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
    const handleApiKeySubmit = useCallback((apiKey: string) => {
        dispatch({ type: 'setApiKey', apiKey });
        setShowApiKeyDialog(false);
    }, []);
    const requestApiKey = useCallback(() => {
        setShowApiKeyDialog(true);
    }, []);

    useEffect(() => {
        if (modelAvailability !== MODEL_AVAILABILITY.AVAILABLE) {
            return;
        }

        if (settings.autoSummaryEnabled) {
            startAutoSummary(settings, onAreaSelect).catch(error => {
                console.error('[Overlay] Auto-summary failed:', error);
            });
        } else {
            stopAutoSummary();
        }

        return () => {
            stopAutoSummary();
        };
    }, [
        settings.autoSummaryEnabled,
        settings.autoSummaryWhitelist,
        onAreaSelect,
        modelAvailability,
    ]);

    if (modelAvailability === MODEL_AVAILABILITY.UNAVAILABLE) {
        return <ModelUnavailable />;
    }

    if (
        modelAvailability === MODEL_AVAILABILITY.DOWNLOADABLE ||
        modelAvailability === MODEL_AVAILABILITY.DOWNLOADING
    ) {
        return (
            <ModelDownloading
                downloadProgress={downloadProgress}
                recheck={recheck}
            />
        );
    }

    return (
        <SettingsContext value={settings}>
            <SettingsDispatchContext value={dispatch}>
                <div className={styles.overlay}>
                    {Object.entries(selections).map(
                        ([
                            key,
                            { portalContainer, selectionResult, links },
                        ]) => (
                            <SelectionPortal
                                portalContainer={portalContainer}
                                selectionResult={selectionResult}
                                summarizer={summarizer}
                                rewriter={rewriter}
                                languageModel={languageModel}
                                onCopySummary={copy}
                                links={links}
                                onUndo={onUndo}
                                portalKey={key}
                                key={key}
                                requestApiKey={requestApiKey}
                                onSummaryComplete={handleSummaryComplete}
                            />
                        )
                    )}
                    <ControlBar
                        isSelectionOverlayActive={
                            status !== AREA_SELECTION_STATUS.DEACTIVATED
                        }
                        activateSelectionOverlay={activate}
                        deactivateSelectionOverlay={deactivate}
                        onAskClick={openPromptOverlay}
                        requestApiKey={requestApiKey}
                    />
                    <PromptOverlay
                        languageModel={languageModel}
                        initialContext={''}
                        onClose={closePromptOverlay}
                        webpageModeEnabled={isWebpageModeEnabled}
                        onToggleWebpage={toggleIsWebpageModeEnabled}
                        isVisible={isPromptOverlayActive}
                    />
                    <ApiKeyDialog
                        show={showApiKeyDialog}
                        onSubmit={handleApiKeySubmit}
                        onCancel={() => setShowApiKeyDialog(false)}
                    />
                    <SelectionOverlay
                        status={status}
                        selectionBounds={selectionBounds}
                    />
                </div>
            </SettingsDispatchContext>
        </SettingsContext>
    );
};

async function computeKey(selectionResult: SelectionResult): Promise<string> {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(selectionResult.text);
    const digestBuffer = await crypto.subtle.digest('SHA-256', data);
    const digestBytes = new Uint8Array(digestBuffer);

    return digestBytes.toBase64();
}

function extractLinks(elements: HTMLElement[]) {
    const links: LinkMapping[] = [];
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

    for (const element of elements) {
        const html = element.innerHTML;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            links.push({
                text: match[2],
                href: match[1],
            });
        }
    }

    return links;
}

export type SelectionPortalBaseProps = {
    portalContainer: HTMLElement;
    selectionResult: SelectionResult;
    links: LinkMapping[];
};

type SelectionPortalProps = SelectionPortalBaseProps & {
    portalKey: string;
    summarizer: CustomSummarizer;
    rewriter: CustomRewriter;
    languageModel: CustomLanguageModel;
    onCopySummary: (value: string) => void;
    onUndo: (key: string) => void;
    requestApiKey: () => void;
    onSummaryComplete: (key: string) => void;
};

const SelectionPortal: React.FC<SelectionPortalProps> = ({
    selectionResult,
    portalContainer,
    summarizer,
    rewriter,
    languageModel,
    onCopySummary,
    onUndo,
    links,
    portalKey,
    requestApiKey,
    onSummaryComplete,
}) => {
    const handleUndo = useCallback(() => onUndo(portalKey), [portalKey]);
    const handleSummaryComplete = useCallback(
        () => onSummaryComplete(portalKey),
        [portalKey, onSummaryComplete]
    );

    return createPortal(
        <InlineSummary
            originalText={selectionResult.text}
            summarizer={summarizer}
            rewriter={rewriter}
            languageModel={languageModel}
            showPromptControls={true}
            showRewriteControls={true}
            onCopySummary={onCopySummary}
            links={links}
            onUndo={handleUndo}
            requestApiKey={requestApiKey}
            onSummaryComplete={handleSummaryComplete}
        />,
        portalContainer,
        portalKey
    );
};
