import styles from '../../../genAI/summarizer/shared/SummarizerStyles.module.css';

interface LoadingButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isLoading: boolean;
    loadingText: string;
    idleText: string;
    svgPath: string;
    className?: string;
}

export function LoadingButton({
    onClick,
    disabled = false,
    isLoading,
    loadingText,
    idleText,
    svgPath,
    className,
}: LoadingButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={className || `${styles.button} ${styles.buttonPrimary}`}
        >
            {isLoading ? (
                <>
                    <img
                        src={chrome.runtime.getURL(svgPath)}
                        alt="Loading"
                        style={{
                            width: '20px',
                            height: '20px',
                            marginRight: '8px',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                    {loadingText}
                </>
            ) : (
                idleText
            )}
        </button>
    );
}
