import React, { useState } from 'react';
import { TextInput, FileInput } from '../../atoms/Input';
import { Button } from '../../atoms/Button';
import { Label } from '../../atoms/Text';
import styles from './AssistantDialog.module.css';

export interface AssistantDialogProps {
    onSave: (name: string, icon: string) => void;
    onCancel: () => void;
    isOpen?: boolean;
}

export interface AssistantDialogData {
    name: string;
    icon: string;
}

export const AssistantDialog: React.FC<AssistantDialogProps> = ({
    onSave,
    onCancel,
    isOpen = true,
}) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [uploadedImageData, setUploadedImageData] = useState<string | null>(
        null
    );

    const handleFileChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const result = e.target?.result as string;
                setUploadedImageData(result);
                setIcon('(Image uploaded)');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const finalIcon = uploadedImageData || icon.trim();
        const finalName = name.trim();

        if (finalName && finalIcon) {
            onSave(finalName, finalIcon);
        } else {
            alert('Please provide both a name and an icon');
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.dialog}>
            <div className={styles.overlay} onClick={handleOverlayClick} />
            <div
                className={styles.container}
                onClick={e => e.stopPropagation()}
            >
                <h2 className={styles.heading}>Create Custom Assistant</h2>

                {}
                <div>
                    <Label text="Name" className={styles.label} />
                    <TextInput
                        placeholder="e.g., Pirate"
                        className={styles.input}
                        value={name}
                        onInput={setName}
                    />
                </div>

                {}
                <div>
                    <Label
                        text="Icon (emoji or image)"
                        className={styles.label}
                    />
                    <TextInput
                        placeholder="e.g., 🏴‍☠️"
                        className={styles.input}
                        value={icon}
                        onInput={setIcon}
                    />
                </div>

                {}
                <div>
                    <label className={styles.label}>Or upload an image:</label>
                    <FileInput
                        accept="image/*"
                        className={styles.file}
                        onChange={handleFileChange}
                    />
                </div>

                {}
                <div className={styles.buttons}>
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className={`${styles.button} ${styles['button--primary']}`}
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};
