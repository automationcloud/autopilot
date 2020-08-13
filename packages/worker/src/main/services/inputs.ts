import { injectable, inject } from 'inversify';
import { Configuration, numberConfig, Logger, util } from '@automationcloud/engine';
import { WorkerState } from './state';
import { SignalsService } from './signals';
import { ApiService } from './api';

const REQUEST_INPUT_TIMEOUT = numberConfig('REQUEST_INPUT_TIMEOUT', 15 * 60000);

@injectable()
export abstract class InputsService {
    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(Logger)
        protected logger: Logger,
        @inject(WorkerState)
        protected state: WorkerState,
        @inject(SignalsService)
        protected signals: SignalsService,
        @inject(ApiService)
        protected api: ApiService,
    ) {
        signals.on('input', (key: string, data: any) => {
            const script = this.state.script;
            if (script) {
                script.$inputs.push({ key, data });
            }
        });
    }

    async requestInputData(key: string): Promise<any> {
        const execution = this.state.getExecution();
        const timeout = this.config.get(REQUEST_INPUT_TIMEOUT);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(onTimeout, timeout);
            const cleanup = () => {
                clearTimeout(timer);
                this.signals.removeListener('input', onInput);
                this.signals.removeListener('terminated', onTerminated);
            };
            this.signals.addListener('input', onInput);
            this.signals.addListener('terminated', onTerminated);

            this.logger.info(`Requesting input ${key}`, { key });
            this.api.requestInputData(execution.id, key).then(jobInput => {
                this.logger.debug(`Request input: API responded`, { jobInput });
                if (jobInput) {
                    const { key, data } = jobInput;
                    onInput(key, data);
                }
            }, onError);

            function onInput(_key: string, data: any) {
                if (key === _key) {
                    cleanup();
                    resolve(data);
                }
            }

            function onError(err: Error) {
                cleanup();
                reject(err);
            }

            function onTerminated() {
                const err = util.createError({
                    code: 'ExecutionTerminated',
                    message: `Execution terminated while waiting for input`,
                    retry: false,
                });
                onError(err);
            }

            function onTimeout() {
                const err = util.createError({
                    code: 'InputTimeout',
                    message: `Input timeout (key=${key})`,
                    retry: false,
                    details: {
                        key,
                    }
                });
                onError(err);
            }
        });
    }

    async peekInputData(key: string): Promise<any> {
        const execution = this.state.getExecution();
        this.logger.info(`Peeking input ${key}`, { key });
        const jobInput = await this.api.getInputData(execution.id, key);

        return jobInput?.data || null;
    }
}
