function throttle<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): T {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let previous = 0;

    return function (this: any, ...args: any[]) {
        const now = Date.now();
        const remaining = wait - (now - previous);

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    } as T;
}

export interface AutoHideControls {
    cleanup: () => void;
    show: () => void;
}

export function makeAutoHide(
    element: HTMLElement,
    options: {
        delay?: number;
        excludeSelectors?: string[];
        onShow?: () => void;
        onHide?: () => void;
    } = {}
): AutoHideControls {
    const { delay = 3000, onShow, onHide } = options;

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleHide = () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }
        hideTimeout = setTimeout(() => {
            element.classList.add('hidden');
            onHide?.();
        }, delay);
    };

    const showAndScheduleHide = () => {
        element.classList.remove('hidden');

        const actualControlBar = element.querySelector(
            '.minerva-control-bar'
        ) as HTMLElement;
        if (actualControlBar) {
            actualControlBar.style.opacity = '0.4';
        }
        onShow?.();
        scheduleHide();
    };

    const handleMouseMove = () => {
        if (!element.classList.contains('hidden')) {
            scheduleHide();
        }
    };

    const handleScrollOrWheel = () => {
        showAndScheduleHide();
    };

    const throttledScrollOrWheel = throttle(handleScrollOrWheel, 100);

    element.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('scroll', throttledScrollOrWheel);
    window.addEventListener('wheel', throttledScrollOrWheel);

    showAndScheduleHide();

    return {
        cleanup: () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
            element.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', throttledScrollOrWheel);
            window.removeEventListener('wheel', throttledScrollOrWheel);
        },
        show: showAndScheduleHide,
    };
}
