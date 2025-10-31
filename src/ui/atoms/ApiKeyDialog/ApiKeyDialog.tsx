import React, { useState } from 'react';

export interface ApiKeyDialogProps {
    show: boolean;

    onSubmit: (apiKey: string) => void;

    onCancel: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({
    show,
    onSubmit,
    onCancel,
}) => {
    const [keyInput, setKeyInput] = useState('');

    if (!show) return null;

    const handleSubmit = () => {
        if (keyInput.trim()) {
            onSubmit(keyInput);
            setKeyInput('');
        }
    };

    const handleCancel = () => {
        setKeyInput('');
        onCancel();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
            }}
            onClick={handleCancel}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    padding: '32px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    minWidth: '400px',
                    maxWidth: '500px',
                }}
            >
                <h3
                    style={{
                        margin: '0 0 8px 0',
                        fontSize: '20px',
                        fontWeight: '600',
                    }}
                >
                    API Key Required
                </h3>
                <p
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        color: '#666',
                    }}
                >
                    Please enter your{' '}
                    <a
                        href="https://aistudio.google.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontWeight: '500',
                        }}
                        onMouseEnter={e => {
                            (e.target as HTMLElement).style.textDecoration =
                                'underline';
                        }}
                        onMouseLeave={e => {
                            (e.target as HTMLElement).style.textDecoration =
                                'none';
                        }}
                    >
                        Google GenAI API key
                    </a>{' '}
                    to use AI generation features.
                </p>
                <p
                    style={{
                        margin: '0 0 20px 0',
                        fontSize: '13px',
                        color: '#d97706',
                        background: '#fef3c7',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        borderLeft: '3px solid #f59e0b',
                    }}
                >
                    ⚠️ Be cautious: this may incur billing usage costs
                </p>
                <input
                    type="password"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="Paste your API key here"
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        boxSizing: 'border-box',
                    }}
                    onKeyPress={e => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            background: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            border: 'none',
                            borderRadius: '8px',
                            background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};
