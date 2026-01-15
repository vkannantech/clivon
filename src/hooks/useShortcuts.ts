
import { useEffect } from 'react';



interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    action: () => void;
}

export const useShortcuts = (shortcuts: ShortcutConfig[]) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused (searching YouTube)
            if (
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                (document.activeElement as HTMLElement).isContentEditable
            ) {
                return;
            }

            for (const config of shortcuts) {
                if (
                    e.key.toLowerCase() === config.key.toLowerCase() &&
                    !!e.ctrlKey === !!config.ctrl &&
                    !!e.altKey === !!config.alt &&
                    !!e.shiftKey === !!config.shift &&
                    !!e.metaKey === !!config.meta // Command on Mac
                ) {
                    e.preventDefault();
                    config.action();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};
