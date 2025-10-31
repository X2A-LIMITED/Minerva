import { useState, useEffect, useRef } from 'react';
import {
    type LanguageCode,
    LANGUAGE_NAMES,
    LANGUAGE_CODE,
} from '../../../genAI/translate/translator';
import styles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';

interface LanguageSelectorProps {
    value: LanguageCode;
    onChange: (language: LanguageCode) => void;
    label: string;
    disabled?: boolean;
}

export function LanguageSelector({
    value,
    onChange,
    label,
    disabled = false,
}: LanguageSelectorProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    const allLanguages = Object.values(LANGUAGE_CODE).map(code => ({
        code: code as LanguageCode,
        name: LANGUAGE_NAMES[code as LanguageCode],
    }));

    const filteredLanguages = allLanguages.filter(
        lang =>
            lang.name.toLowerCase().includes(search.toLowerCase()) ||
            lang.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                selectorRef.current &&
                !selectorRef.current.contains(event.target as Node)
            ) {
                setSearchOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div
            ref={selectorRef}
            className={styles.languageField}
            style={{ flex: 1, position: 'relative' }}
            data-no-drag="true"
        >
            <label className={styles.label}>{label}:</label>
            <div
                onClick={e => {
                    e.stopPropagation();
                    if (!disabled) {
                        setSearchOpen(!searchOpen);
                    }
                }}
                onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className={styles.select}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                data-no-drag="true"
            >
                <span>{LANGUAGE_NAMES[value]}</span>
                <span>{searchOpen ? '▲' : '▼'}</span>
            </div>
            {searchOpen && (
                <div
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: '10px',
                        marginTop: '4px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        placeholder="Search languages..."
                        className={styles.textarea}
                        style={{
                            margin: '8px',
                            width: 'calc(100% - 16px)',
                            padding: '8px 12px',
                        }}
                        autoFocus
                    />
                    <div>
                        {filteredLanguages.map(lang => (
                            <div
                                key={lang.code}
                                onClick={() => {
                                    onChange(lang.code);
                                    setSearchOpen(false);
                                    setSearch('');
                                }}
                                style={{
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    background:
                                        value === lang.code
                                            ? 'rgba(0, 123, 255, 0.1)'
                                            : 'transparent',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => {
                                    if (value !== lang.code) {
                                        (
                                            e.target as HTMLElement
                                        ).style.background =
                                            'rgba(0, 0, 0, 0.05)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (value !== lang.code) {
                                        (
                                            e.target as HTMLElement
                                        ).style.background = 'transparent';
                                    }
                                }}
                            >
                                {lang.name}{' '}
                                <span
                                    style={{
                                        color: '#999',
                                        fontSize: '12px',
                                    }}
                                >
                                    ({lang.code})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
