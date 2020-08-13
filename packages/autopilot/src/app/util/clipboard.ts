import { clipboard } from 'electron';
import { util } from '@automationcloud/engine';

export function readText() {
    return clipboard.readText() || '';
}

export function readObjectData(type?: string): any {
    const obj = readObject() || {};
    return type == null || obj.type === type ? obj.data : null;
}

export function readObject(): any {
    try {
        const obj = JSON.parse(clipboard.readText());
        return obj;
    } catch (err) {
        return null;
    }
}

export function writeObject(obj: any) {
    const text = JSON.stringify(obj, null, 4);
    clipboard.writeText(text);
}

export function writeText(text: string) {
    clipboard.writeText(text);
}

export function getObjectType(): string {
    const obj = readObject();
    return (obj && obj.type) || 'empty';
}

export function hasObjectType(type: string): boolean {
    return getObjectType() === type;
}

export function getUrl() {
    const text = clipboard.readText().trim();
    return util.parseUrl(text);
}
