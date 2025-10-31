import styles from './ExpandGroup.module.css';

export type ExpandGroupProps = {
    elements: {
        key: string;
        element: React.ComponentType<{ expanded: boolean }>;
    }[];
    expanded: string | null;
};

export const ExpandGroup: React.FC<ExpandGroupProps> = ({
    elements,
    expanded,
}) => {
    const containerClassName =
        `${styles.group} ${styles.container} ${expanded ? styles.expanded : ''}`.trim();

    return (
        <div className={containerClassName}>
            {elements.map(({ key, element: Element }) => (
                <Element key={key} expanded={expanded === key} />
            ))}
        </div>
    );
};
