
declare module 'jsdiff' {
    export interface Change {
        value: string;
        added: boolean;
        removed: boolean;
    }
    export function diffLines(oldStr: string, newStr: string): Change[];
}

declare module 'json-stable-stringify' {
    // eslint-disable-next-line import/no-default-export
    export default function stringify(obj: any, opts: any): string;
}
