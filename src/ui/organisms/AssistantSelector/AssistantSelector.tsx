import React from 'react';
import { Card } from '../../molecules/Card';
import styles from './AssistantSelector.module.css';

export interface Assistant {
    id: string;
    name: string;
    icon: string;
    isCustom: boolean;
}

export interface AssistantSelectorProps {
    builtInAssistants: Assistant[];
    customAssistants: Assistant[];
    selectedId: string;
    onSelect: (assistant: Assistant) => void;
    onAddClick: () => void;
    onDeleteClick?: (assistant: Assistant) => void;
    expandDirection?: 'up' | 'down';
    expanded?: boolean;
}

export const AssistantSelector: React.FC<AssistantSelectorProps> = ({
    builtInAssistants,
    customAssistants,
    selectedId,
    onSelect,
    onAddClick,
    onDeleteClick,
    expandDirection = 'down',
    expanded = false,
}) => {
    const expandSectionClassName =
        `${styles.expand} ${styles[`expand${expandDirection === 'up' ? 'Up' : 'Down'}`]} ${expanded ? styles.expanded : ''}`.trim();

    const handleDeleteClick = (e: React.MouseEvent, assistant: Assistant) => {
        e.stopPropagation();
        if (onDeleteClick) {
            onDeleteClick(assistant);
        }
    };

    return (
        <div className={expandSectionClassName}>
            <div className={styles.content}>
                <h3 className={styles.heading}>Choose your Assistant</h3>
                <div className={styles.grid}>
                    {}
                    {builtInAssistants.map(assistant => (
                        <div
                            key={assistant.id}
                            data-assistant-id={assistant.id}
                        >
                            <Card
                                icon={assistant.icon}
                                name={assistant.name}
                                selected={assistant.id === selectedId}
                                onClick={() => onSelect(assistant)}
                            />
                        </div>
                    ))}

                    {}
                    {customAssistants.map(assistant => (
                        <div
                            key={assistant.id}
                            data-assistant-id={assistant.id}
                            style={{ position: 'relative' }}
                        >
                            <Card
                                icon={assistant.icon}
                                name={assistant.name}
                                selected={assistant.id === selectedId}
                                onClick={() => onSelect(assistant)}
                            />
                            {onDeleteClick && (
                                <button
                                    className="minerva-assistant-card__delete"
                                    title="Delete assistant"
                                    onClick={e =>
                                        handleDeleteClick(e, assistant)
                                    }
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}

                    {}
                    <Card
                        icon="+"
                        name="Add"
                        onClick={onAddClick}
                        className="minerva-assistant-card--add"
                    />
                </div>
            </div>
        </div>
    );
};
