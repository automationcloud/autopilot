import * as util from '../util';
import { injectable } from 'inversify';
import { SessionHandler } from '../session';

/**
 * Manages script globals.
 *
 * Script can store shared global state via `set-global` and `append-global` actions.
 * This state can subsequently be accessed using `get-global` pipe.
 *
 * References:
 *
 * - on Executor reset (e.g. when playback clears, or on new execution), globals need to be cleared.
 * - on Checkpoint Restore globals should be taken from Checkpoint object.
 *
 * @internal
 */
@injectable()
@SessionHandler()
export class GlobalsService {
    values: GlobalValue[] = [];

    async onSessionStart() {
        await this.clean();
    }

    async onSessionFinish() {
        await this.clean();
    }

    async clean() {
        this.values = [];
    }

    // Globals

    getKeys() {
        return this.values.map(_ => _.key);
    }

    getGlobal(key: string, optional: boolean = false): any {
        util.assertScript(key, 'key is required to access globals');
        const globl = this.values.find(_ => _.key === key) || { value: null };
        const value = globl.value == null ? null : globl.value;
        util.assertPlayback(
            value != null || optional,
            `Requested global ${key} is null. Use optional: true if this is intended.`,
        );
        return value;
    }

    setGlobal(key: string, value: any): void {
        const existing = this.values.find(_ => _.key === key);
        if (existing) {
            existing.value = value;
        } else {
            this.values.push({ key, value });
        }
    }

    appendGlobal(key: string, values: any[]): void {
        const existing = this.values.find(_ => _.key === key);
        if (existing) {
            const array = existing.value == null ? [] : existing.value;
            const type = util.getType(array);
            util.assertPlayback(type === 'array', `Expected global to contain array, instead got ${type}`);
            existing.value = array.concat(values);
        } else {
            this.values.push({ key, value: values });
        }
    }

    removeGlobal(key: string): void {
        this.values = this.values.filter(_ => _.key !== key);
    }
}

export interface GlobalValue {
    key: string;
    value: any;
}
