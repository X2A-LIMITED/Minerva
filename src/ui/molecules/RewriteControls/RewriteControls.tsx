import React, { useMemo } from 'react';
import { Button } from '../../atoms';
import styles from './RewriteControls.module.css';
import type { RewriteStatusText } from '../../../hooks';

export interface RewriteControlsProps {
    onRewrite: () => void | Promise<void>;
    buttonText?: string;
    loading?: boolean;
    disabled?: boolean;
    statusText?: RewriteStatusText;
}

export interface RewriteControlsHandle {
    setLoading: (loading: boolean) => void;
    setStatus: (text: string, show?: boolean) => void;
    setDisabled: (disabled: boolean) => void;
}

export const RewriteControls: React.FC<RewriteControlsProps> = ({
    loading,
    onRewrite,
    disabled,
    statusText,
    buttonText,
}) => {
    const buttonClassName =
        `${styles.button} ${loading ? styles.loading : ''}`.trim();
    const statusElement = useMemo(
        () =>
            (
                ({
                    '': null,
                    loading: <>Rewriting for kids...</>,
                    success: <>Explained for kids</>,
                    empty: <>Rewrite returned empty text</>,
                    aborted: <>Rewrite cancelled</>,
                    'not-supported': (
                        <>
                            Rewriter API not supported in this browser.{' '}
                            <a
                                target="_blank"
                                href="https://developer.chrome.com/docs/ai/rewriter-api#get_started"
                            >
                                Please enable.
                            </a>
                        </>
                    ),
                    'no-model-available': <>Rewriter model not available yet</>,
                    error: <>An unexpected error occured</>,
                }) satisfies Record<
                    RewriteStatusText,
                    React.ReactElement | null
                >
            )[statusText ?? ''],
        [statusText]
    );

    return (
        <div className={styles.controls}>
            <Button
                variant="secondary"
                size="sm"
                disabled={disabled || loading}
                className={buttonClassName}
                onClick={onRewrite}
            >
                {buttonText}
            </Button>
            <span className={styles.status}>{statusElement}</span>
        </div>
    );
};
