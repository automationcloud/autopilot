export interface KeyboardShortcut {
    key: string;
    alt: boolean;
    shift: boolean;
    ctrl: boolean;
    cmd: boolean;
    cmdOrCtrl: boolean;
}

export function parseShortcut(shortcut: string): KeyboardShortcut {
    const parts = shortcut.split('+');
    return {
        alt: parts.includes('Alt'),
        shift: parts.includes('Shift'),
        ctrl: parts.includes('Ctrl'),
        cmd: parts.includes('Cmd'),
        cmdOrCtrl: parts.includes('CmdOrCtrl') || parts.includes('CtrlOrCmd'),
        key: parseShortcutKey(parts.slice(-1)[0]),
    };
}

export function matchShortcut(ev: KeyboardEvent, shortcut: string): boolean {
    const ss = parseShortcut(shortcut);
    return (
        ev.key === ss.key &&
        ev.altKey === ss.alt &&
        ev.shiftKey === ss.shift &&
        (ev.ctrlKey === ss.ctrl || ev.ctrlKey === ss.cmdOrCtrl) &&
        (ev.metaKey === ss.cmd || ev.metaKey === ss.cmdOrCtrl)
    );
}

export function handle(ev: KeyboardEvent, shortcuts: { [key: string]: () => void }) {
    for (const [shortcut, fn] of Object.entries(shortcuts)) {
        if (matchShortcut(ev, shortcut)) {
            ev.preventDefault();
            fn();
            return;
        }
    }
}

export function parseShortcutKey(shortcutKey: string): string {
    switch (shortcutKey) {
        case 'Space':
            return ' ';
        case 'Esc':
            return 'Escape';
        default:
            return shortcutKey;
    }
}
