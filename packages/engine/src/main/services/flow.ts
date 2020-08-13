import { injectable } from 'inversify';
import { Exception } from '@automationcloud/cdp';
import { Script } from '../script';

@injectable()
export abstract class FlowService {
    isInputsCached(): boolean {
        return true;
    }

    abstract async requestInputData(key: string): Promise<any>;
    abstract async peekInputData(key: string): Promise<any>;
    abstract async sendOutputData(key: string, data: any): Promise<void>;

    /**
     * Invoked during script playback (before action, before context match attempt,
     * before action retry, etc).
     * Executor can implement custom logic here to synchronize script playback
     * with external events or to interrupt it.
     */
    async tick(script: Script) {
        if (script.isPaused()) {
            throw new Exception({
                name: 'ScriptExecutionInterrupted',
                message: 'Script execution interrupted',
                retry: false,
            });
        }
    }

    /**
     * Returns information available in a specific runtime (e.g. worker id, job id, etc)
     *
     * @experimental
     */
    getMetadata(): any {
        return {};
    }

}
