import { StandardLogger } from '@ubio/framework';
import { injectable, inject } from 'inversify';
import { WorkerState } from '../services/state';

@injectable()
export class WorkerLogger extends StandardLogger {
    constructor(
        @inject(WorkerState)
        protected state: WorkerState,
    ) {
        super();
    }

    _contextData: object = {};

    get contextData() {
        // Note: this solves circular dependency problem.
        return {
            ...this.state.getInfo(),
            ...this._contextData,
        };
    }

    set contextData(data: object) {
        this._contextData = data;
    }
}
