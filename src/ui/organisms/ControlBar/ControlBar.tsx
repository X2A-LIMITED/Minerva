import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { ControlItem } from '../../molecules';
import { Logo } from '../../atoms';
import { AssistantSelector, type Assistant } from '../AssistantSelector';
import { AssistantDialog } from '../AssistantSelector';
import {
    getSelectedAssistant,
    saveSelectedAssistant,
    getCustomAssistants,
    addCustomAssistant,
    type AssistantConfig,
} from '../../utils';
import { extensionStorage } from '../../../utils/extensionStorage';
import type { SelectionResult } from '../../../selection/selection';

import YoutubeSummaryUI from '../../../genAI/summarizer/youtubeSummarizer/YoutubeSummarizer';
import TextSummarizerUI from '../../../genAI/summarizer/TextSummarizer';
import FileSummarizer from '../../../genAI/summarizer/fileSummarizer/FileSummarizer';
import ImageGenerator from '../../../genAI/imageGenerator/ImageGenerator';
import SpeechGenerator from '../../../genAI/speechGenerator/SpeechGenerator';
import TextWriter from '../../../genAI/textGenerator/TextWriter';
import TranslateOverlay from '../../../genAI/translate/TranslateOverlay.tsx';
import SettingsModal from '../../../genAI/settings/SettingsModal';
import { ExpandGroup } from '../../molecules/ExpandGroup';
import styles from './ControlBar.module.css';
import menuStyles from '../AutoExpand/AutoExpand.module.css';

export interface ControlBarProps {
    isSelectionOverlayActive: boolean;
    activateSelectionOverlay: () => Promise<SelectionResult>;
    deactivateSelectionOverlay: () => void;
    onAskClick?: () => void;
    onSettingsClick?: () => void;
    toggleHandlers?: {
        onToggleOn?: () => void;
        onToggleOff?: () => void;
    };
    requestApiKey: () => void;
}

const BUILT_IN_ASSISTANTS: Omit<Assistant, 'isCustom'>[] = [
    { id: 'default', name: 'Default', icon: '👤' },
    {
        id: 'kid',
        name: 'Kid',
        icon: chrome.runtime.getURL('personality/kid.svg'),
    },
    {
        id: 'gandalf',
        name: 'Gandalf',
        icon: chrome.runtime.getURL('personality/gandalf.svg'),
    },
];

interface LogoMenuItem {
    name: string;
    icon: string;
    type: 'area-selector' | 'file' | 'video' | 'text';
}

interface AIToolMenuItem {
    name: string;
    icon: string;
    type: 'image' | 'speech' | 'text' | 'translate';
}

const TLDR_MENU_ITEMS: LogoMenuItem[] = [
    {
        name: 'Select',
        icon: '🔲',
        type: 'area-selector',
    },
    {
        name: 'File',
        icon: '📄',
        type: 'file',
    },
    {
        name: 'Youtube Link',
        icon: '🎥',
        type: 'video',
    },
    {
        name: 'Text',
        icon: '📝',
        type: 'text',
    },
];

const AI_TOOLS_MENU_ITEMS: AIToolMenuItem[] = [
    {
        name: 'Write',
        icon: '✍️',
        type: 'text',
    },
    {
        name: 'Translate',
        icon: '🌐',
        type: 'translate',
    },
    {
        name: 'Image',
        icon: '🖼️',
        type: 'image',
    },
    {
        name: 'Speech',
        icon: chrome.runtime.getURL('icons/audio.svg'),
        type: 'speech',
    },
];

const LogoMenu: React.FC<{
    items: LogoMenuItem[];
    expanded: boolean;
    onItemClick: (type: LogoMenuItem['type']) => void;
}> = ({ items, expanded, onItemClick }) => {
    const expandClassName =
        `${menuStyles.expand} ${expanded ? menuStyles.expanded : ''}`.trim();

    return (
        <div className={expandClassName}>
            <div className={menuStyles.content}>
                {items.map(item => (
                    <div
                        key={item.type}
                        onClick={() => onItemClick(item.type)}
                        className={menuStyles.provider}
                    >
                        <span className={menuStyles.icon}>{item.icon}</span>
                        <label className={menuStyles.label}>{item.name}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AIToolsMenu: React.FC<{
    items: AIToolMenuItem[];
    expanded: boolean;
    onItemClick: (type: AIToolMenuItem['type']) => void;
}> = ({ items, expanded, onItemClick }) => {
    const expandClassName =
        `${menuStyles.expand} ${expanded ? menuStyles.expanded : ''}`.trim();

    return (
        <div className={expandClassName}>
            <div className={menuStyles.content}>
                {items.map(item => (
                    <div
                        key={item.type}
                        onClick={() => onItemClick(item.type)}
                        className={menuStyles.provider}
                    >
                        <span className={menuStyles.icon}>
                            {item.icon.endsWith('.svg') ? (
                                <img
                                    src={item.icon}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : (
                                item.icon
                            )}
                        </span>
                        <label className={menuStyles.label}>{item.name}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FullScreenOverlay: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    <div
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
        }}
    >
        {children}
    </div>
);

type OverlayType =
    | 'file'
    | 'video'
    | 'text'
    | 'image'
    | 'speech'
    | 'textWriter'
    | 'translate'
    | 'settings'
    | null;

interface OverlayConfig {
    component: React.ComponentType<any>;
    props?: (baseProps: {
        requestApiKey: () => void;
        onClose: () => void;
    }) => Record<string, any>;
    fullScreen?: boolean;
}

const OVERLAY_CONFIGS: Record<Exclude<OverlayType, null>, OverlayConfig> = {
    file: {
        component: FileSummarizer,
        props: ({ requestApiKey, onClose }) => ({
            requestApiKey,
            onClose,
        }),
        fullScreen: true,
    },
    video: {
        component: YoutubeSummaryUI,
        props: ({ requestApiKey, onClose }) => {
            const currentUrl = window.location.href;
            const isYouTube =
                currentUrl.includes('youtube.com/watch') ||
                currentUrl.includes('youtu.be/');

            return {
                requestApiKey,
                onClose,
                initialUrl: isYouTube ? currentUrl : '',
            };
        },
        fullScreen: true,
    },
    text: {
        component: TextSummarizerUI,
        props: ({ onClose }) => ({ onClose }),
        fullScreen: true,
    },
    image: {
        component: ImageGenerator,
        props: ({ requestApiKey, onClose }) => ({
            requestApiKey,
            onClose,
        }),
        fullScreen: true,
    },
    speech: {
        component: SpeechGenerator,
        props: ({ requestApiKey, onClose }) => ({
            requestApiKey,
            onClose,
        }),
        fullScreen: true,
    },
    textWriter: {
        component: TextWriter,
        props: ({ onClose }) => ({ onClose }),
        fullScreen: true,
    },
    translate: {
        component: TranslateOverlay,
        props: ({ onClose }) => ({ onClose }),
        fullScreen: false,
    },
    settings: {
        component: SettingsModal,
        props: ({ onClose }) => ({ onClose }),
        fullScreen: true,
    },
};

export const ControlBar: React.FC<ControlBarProps> = ({
    isSelectionOverlayActive,
    activateSelectionOverlay,
    deactivateSelectionOverlay,
    onAskClick,
    requestApiKey,
}) => {
    const [assistantExpanded, setAssistantExpanded] = useState(false);
    const [selectedAssistant, setSelectedAssistant] = useState<AssistantConfig>(
        {
            id: 'default',
            name: 'Default',
            icon: '👤',
            isCustom: false,
        }
    );
    const [showAssistantDialog, setShowAssistantDialog] = useState(false);
    const [customAssistants, setCustomAssistants] = useState<AssistantConfig[]>(
        []
    );
    const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);

    useEffect(() => {
        getSelectedAssistant().then(assistant => {
            setSelectedAssistant(assistant);
        });
        getCustomAssistants().then(assistants => {
            setCustomAssistants(assistants);
        });
    }, []);
    const [expanded, setExpanded] = useState<string | null>(null);

    const controlBarRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
    });
    const opacityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    useEffect(() => {
        const element = controlBarRef.current;
        if (!element) return;

        const loadPosition = async () => {
            try {
                const position = await extensionStorage.getItem<{
                    x: number;
                    y: number;
                }>('minerva-control-bar-position');
                if (position) {
                    element.style.left = `${position.x}px`;
                    element.style.top = `${position.y}px`;
                    element.style.transform = 'none';
                }
            } catch (e) {
                console.warn('Failed to load control bar position:', e);
            }
        };

        loadPosition();

        const scheduleOpacityFade = () => {
            if (opacityTimeoutRef.current) {
                clearTimeout(opacityTimeoutRef.current);
            }
            opacityTimeoutRef.current = setTimeout(() => {
                if (element && element.style.opacity !== '0') {
                    element.style.opacity = '0';
                }
                opacityTimeoutRef.current = null;
            }, 3000);
        };

        const cancelOpacityFade = () => {
            if (opacityTimeoutRef.current) {
                clearTimeout(opacityTimeoutRef.current);
                opacityTimeoutRef.current = null;
            }
        };

        let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
        const handleScrollOrWheel = () => {
            if (scrollTimeout) return;

            scrollTimeout = setTimeout(() => {
                if (element && element.style.opacity === '0') {
                    element.style.opacity = '0.4';
                }
                scheduleOpacityFade();
                scrollTimeout = null;
            }, 100);
        };

        const handleMouseEnter = () => {
            cancelOpacityFade();
            element.style.opacity = '1';
        };

        const handleMouseLeave = () => {
            if (element.style.opacity === '1') {
                element.style.opacity = '0.4';
            }
            scheduleOpacityFade();
        };

        window.addEventListener('scroll', handleScrollOrWheel);
        window.addEventListener('wheel', handleScrollOrWheel);
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'LABEL' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'IMG' ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('label') ||
                target.closest('textarea')
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

            element.classList.add('dragging');
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

            element.style.left = `${boundedX}px`;
            element.style.top = `${boundedY}px`;
            element.style.transform = 'none';

            e.preventDefault();
        };

        const handleMouseUp = () => {
            if (!dragStateRef.current.isDragging) return;

            dragStateRef.current.isDragging = false;
            element.classList.remove('dragging');

            const rect = element.getBoundingClientRect();
            extensionStorage
                .setItem('minerva-control-bar-position', {
                    x: rect.left,
                    y: rect.top,
                })
                .catch(e => {
                    console.warn('Failed to save control bar position:', e);
                });
        };

        element.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('scroll', handleScrollOrWheel);
            window.removeEventListener('wheel', handleScrollOrWheel);
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);

            if (opacityTimeoutRef.current) {
                clearTimeout(opacityTimeoutRef.current);
            }
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
        };
    }, []);

    const handleSelectClick = useCallback(async () => {
        if (isSelectionOverlayActive) {
            deactivateSelectionOverlay();
            return;
        }

        await activateSelectionOverlay().catch(() => undefined);
    }, [
        isSelectionOverlayActive,
        activateSelectionOverlay,
        deactivateSelectionOverlay,
    ]);

    const handleAssistantSelect = async (assistant: Assistant) => {
        await saveSelectedAssistant(assistant);
        setSelectedAssistant(assistant);
        setAssistantExpanded(false);
    };

    const handleAddAssistantClick = () => {
        setShowAssistantDialog(true);
    };

    const handleSaveAssistant = async (name: string, icon: string) => {
        const newAssistant: Assistant = {
            id: `custom-${Date.now()}`,
            name,
            icon,
            isCustom: true,
        };

        await addCustomAssistant(newAssistant);
        await saveSelectedAssistant(newAssistant);
        setSelectedAssistant(newAssistant);
        setCustomAssistants([...customAssistants, newAssistant]);
        setShowAssistantDialog(false);
        setAssistantExpanded(false);
    };

    const hideControlBar = useCallback(() => {
        if (controlBarRef.current) {
            controlBarRef.current.style.opacity = '0';
        }
    }, []);

    const restoreControlBarOpacity = useCallback(() => {
        const element = controlBarRef.current;
        if (element) {
            element.style.opacity = '0.4';

            if (opacityTimeoutRef.current) {
                clearTimeout(opacityTimeoutRef.current);
            }
            opacityTimeoutRef.current = setTimeout(() => {
                if (element && element.style.opacity !== '1') {
                    element.style.opacity = '0';
                }
                opacityTimeoutRef.current = null;
            }, 3000);
        }
    }, []);

    const openOverlay = useCallback(
        (overlay: OverlayType) => {
            setExpanded(null);
            hideControlBar();
            setActiveOverlay(overlay);
        },
        [hideControlBar]
    );

    const closeOverlay = useCallback(() => {
        setActiveOverlay(null);
        restoreControlBarOpacity();
    }, [restoreControlBarOpacity]);

    const handleLogoClick = useCallback(() => {
        setExpanded(expanded => (expanded === 'tldr' ? null : 'tldr'));
    }, []);

    const handleLogoMenuItemClick = useCallback(
        (type: LogoMenuItem['type']) => {
            setExpanded(null);
            hideControlBar();

            switch (type) {
                case 'area-selector':
                    handleSelectClick();
                    break;
                case 'file':
                    openOverlay('file');
                    break;
                case 'video':
                    openOverlay('video');
                    break;
                case 'text':
                    openOverlay('text');
                    break;
            }
        },
        [handleSelectClick, hideControlBar, openOverlay]
    );

    const handleAiToolsClick = useCallback(() => {
        setExpanded(expanded => (expanded === 'aiTools' ? null : 'aiTools'));
    }, []);

    const handleAiToolsMenuItemClick = useCallback(
        (type: AIToolMenuItem['type']) => {
            switch (type) {
                case 'text':
                    openOverlay('textWriter');
                    break;
                case 'translate':
                    openOverlay('translate');
                    break;
                case 'image':
                    openOverlay('image');
                    break;
                case 'speech':
                    openOverlay('speech');
                    break;
            }
        },
        [openOverlay]
    );

    const expandItems: {
        key: string;
        element: React.ComponentType<{ expanded: boolean }>;
    }[] = useMemo(
        () => [
            {
                key: 'tldr',
                element: ({ expanded }) => (
                    <LogoMenu
                        expanded={expanded}
                        items={TLDR_MENU_ITEMS}
                        onItemClick={handleLogoMenuItemClick}
                    />
                ),
            },
            {
                key: 'aiTools',
                element: ({ expanded }) => (
                    <AIToolsMenu
                        expanded={expanded}
                        items={AI_TOOLS_MENU_ITEMS}
                        onItemClick={handleAiToolsMenuItemClick}
                    />
                ),
            },
        ],
        [handleLogoMenuItemClick, handleAiToolsMenuItemClick]
    );

    return (
        <>
            <div className={styles.bar} ref={controlBarRef}>
                <div className={styles.main}>
                    <ControlItem
                        icon={
                            <Logo
                                src={chrome.runtime.getURL(
                                    expanded === 'tldr'
                                        ? 'icons/tldr-loop.svg'
                                        : 'icons/tldr.svg'
                                )}
                            />
                        }
                        label="TL;DR"
                        active={expanded === 'tldr'}
                        onClick={handleLogoClick}
                    />
                    <ControlItem
                        icon={<Logo />}
                        label="Chat"
                        onClick={onAskClick}
                    />
                    <ControlItem
                        icon={
                            <Logo
                                src={chrome.runtime.getURL(
                                    expanded === 'aiTools'
                                        ? 'icons/gen-loop.svg'
                                        : 'icons/gen.svg'
                                )}
                            />
                        }
                        label="Create"
                        active={expanded === 'aiTools'}
                        onClick={handleAiToolsClick}
                    />
                    <ControlItem
                        icon={
                            <Logo
                                src={chrome.runtime.getURL(
                                    'icons/settings.svg'
                                )}
                            />
                        }
                        label="Settings"
                        onClick={() => openOverlay('settings')}
                    />
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                    {}
                </div>

                <ExpandGroup elements={expandItems} expanded={expanded} />

                <AssistantSelector
                    builtInAssistants={BUILT_IN_ASSISTANTS.map(a => ({
                        ...a,
                        isCustom: false,
                    }))}
                    customAssistants={customAssistants.map(a => ({
                        ...a,
                        isCustom: a.isCustom ?? true,
                    }))}
                    selectedId={selectedAssistant.id}
                    onSelect={handleAssistantSelect}
                    onAddClick={handleAddAssistantClick}
                    expanded={assistantExpanded}
                />
            </div>

            {showAssistantDialog && (
                <AssistantDialog
                    onSave={handleSaveAssistant}
                    onCancel={() => setShowAssistantDialog(false)}
                />
            )}

            {activeOverlay &&
                (() => {
                    const config = OVERLAY_CONFIGS[activeOverlay];
                    const Component = config.component;
                    const componentProps = config.props?.({
                        requestApiKey,
                        onClose: closeOverlay,
                    }) || { onClose: closeOverlay };

                    const element = <Component {...componentProps} />;

                    return config.fullScreen ? (
                        <FullScreenOverlay>{element}</FullScreenOverlay>
                    ) : (
                        element
                    );
                })()}
        </>
    );
};
