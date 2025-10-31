import React from 'react';
import styles from './AutoExpand.module.css';

export interface Provider {
    name: string;
    icon: string;
    checked: boolean;
}

export interface AutoExpandProps {
    providers: Provider[];
    onChange: (providerName: string, checked: boolean) => void;
    expanded?: boolean;
}

const ProviderItem: React.FC<{
    provider: Provider;
    onChange: (providerName: string, checked: boolean) => void;
}> = ({ provider, onChange }) => {
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(provider.name, e.target.checked);
    };

    const handleLabelClick = () => {
        onChange(provider.name, !provider.checked);
    };

    return (
        <div className={styles.provider}>
            <input
                type="checkbox"
                className={styles.checkbox}
                checked={provider.checked}
                onChange={handleCheckboxChange}
            />
            <img
                className={styles.icon}
                src={provider.icon}
                alt={provider.name}
            />
            <label
                className={styles.label}
                style={{ cursor: 'pointer' }}
                onClick={handleLabelClick}
            >
                {provider.name}
            </label>
        </div>
    );
};

export const AutoExpand: React.FC<AutoExpandProps> = ({
    providers,
    onChange,
    expanded = false,
}) => {
    const expandClassName =
        `${styles.expand} ${expanded ? styles.expanded : ''}`.trim();

    return (
        <div className={expandClassName}>
            <div className={styles.content}>
                {providers.map(provider => (
                    <ProviderItem
                        key={provider.name}
                        provider={provider}
                        onChange={onChange}
                    />
                ))}
            </div>
        </div>
    );
};
