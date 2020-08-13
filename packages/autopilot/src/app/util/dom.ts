export function getFocusableElements(opts: { base?: HTMLElement; includeCodeMirror?: boolean }): HTMLElement[] {
    const { base = document.documentElement, includeCodeMirror = false } = opts;
    const els = [
        ...base.querySelectorAll(
            [
                'a:not([disabled])',
                'button:not([disabled])',
                'input[type=text]:not([disabled])',
                '[tabindex]:not([disabled]):not([tabindex="-1"])',
            ].join(', '),
        ),
    ] as HTMLElement[];
    return els.filter(el => {
        if (!includeCodeMirror && isInsideCodeMirror(el)) {
            return false;
        }
        return true;
    });
}

export function getNextFocusableElement(
    opts: {
        cycle?: boolean;
        base?: HTMLElement;
        includeCodeMirror?: boolean;
    } = {},
): HTMLElement | null {
    const { cycle = false, base = document.documentElement, includeCodeMirror = false } = opts;
    const els = getFocusableElements({ base, includeCodeMirror });
    const activeEl = document.activeElement as HTMLElement;
    let i = els.indexOf(activeEl!) + 1;
    if (cycle) {
        i = i + (els.length % els.length);
    }
    return els[i];
}

export function getPreviousFocusableElement(
    opts: {
        cycle?: boolean;
        base?: HTMLElement;
        includeCodeMirror?: boolean;
    } = {},
): HTMLElement | null {
    const { cycle = false, base = document.documentElement, includeCodeMirror = false } = opts;
    const els = getFocusableElements({ base, includeCodeMirror });
    const activeEl = document.activeElement as HTMLElement;
    let i = els.indexOf(activeEl!) - 1;
    if (cycle) {
        i = i + (els.length % els.length);
    }
    return els[i];
}

export function getSelectableElements(base: HTMLElement): HTMLElement[] {
    return [...base.querySelectorAll('[data-selection-id][tabindex]')] as HTMLElement[];
}

export function getSelectableSibling(
    opts: {
        next?: boolean;
        cycle?: boolean;
        base?: HTMLElement;
    } = {},
): HTMLElement | null {
    const { next = false, cycle = false, base = document.documentElement } = opts;
    const els = getSelectableElements(base);
    const activeEl = document.activeElement as HTMLElement;
    let i = els.indexOf(activeEl!) + (next ? 1 : -1);
    if (cycle) {
        i = i + (els.length % els.length);
    }
    return els[i];
}

export function isInputElement(el: HTMLElement) {
    return ['input', 'textarea'].includes(el.nodeName.toLowerCase());
}

export function isInsideCodeMirror(el: HTMLElement) {
    return el.closest('.CodeMirror') != null;
}

export function isInputFocused() {
    const el = document.activeElement as HTMLElement;
    return el && isInputElement(el);
}

export function isTextSelected() {
    return !!document.getSelection()?.toString();
}

/**
 * Indicates whether standard copy/paste edit menu should be rendered instead of app-specific one.
 */
export function isTextEditContext() {
    return isInputFocused() || isTextSelected();
}

export function getHorizontalScrollParent(el: HTMLElement): HTMLElement | null {
    const style = getComputedStyle(el);
    if (style.overflowX === 'auto' && el.clientWidth < el.scrollWidth) {
        return el;
    }
    if (el.parentElement) {
        return getHorizontalScrollParent(el.parentElement);
    }
    return null;
}

export function getVerticalScrollParent(el: HTMLElement): HTMLElement | null {
    const style = getComputedStyle(el);
    if (style.overflowY === 'auto' && el.clientHeight < el.scrollHeight) {
        return el;
    }
    if (el.parentElement) {
        return getVerticalScrollParent(el.parentElement);
    }
    return null;
}
