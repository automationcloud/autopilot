/* eslint-disable import/no-default-export */

declare module 'parse-color' {
    interface Color {
        rgb: [number, number, number];
        hsl: [number, number, number];
        hsv: [number, number, number];
        cmyk: [number, number, number, number];
        keyword?: string;
        hex: string;
        rgba: [number, number, number, number];
        hsla: [number, number, number, number];
        hsva: [number, number, number, number];
        cmyka: [number, number, number, number, number];
    }

    function parseColor(str: string): Color;
    export = parseColor;
}

declare module 'data-urls' {
    function parse(dataUrl: string): { mimeType: string; body: Buffer } | null;
    export = parse;
}

declare module 'jsonpointer' {
    export function get(object: any, path: string): any;
    export function set(object: any, path: string, value: any): void;
}
