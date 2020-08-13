import { Action } from '../action';
import { params } from '../model';

export class SleepAction extends Action {
    static $type = 'Flow.sleep';
    static $icon = 'fas fa-hourglass-half';
    static $help = `
Waits for specified number of milliseconds.

This is unreliable (but easy) method of waiting for arbitrarily long processes to finish.
It is recommended to use Expect for scripting such cases, whenever it is possible to do so.

### Parameters

- delay: milliseconds to wait
`;

    @params.Number({ min: 0 })
    delay: number = 1000;

    async exec() {
        const timeoutAt = Date.now() + this.delay;
        while (Date.now() < timeoutAt) {
            await new Promise(r => setTimeout(r, 100));
            await this.$script.tick();
        }
    }
}
