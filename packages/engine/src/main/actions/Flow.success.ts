import { Action } from '../action';

export class SuccessAction extends Action {
    static $type = 'Flow.success';
    static $icon = 'fas fa-check-circle';
    static $help = `
Finishes script execution with Success status.

Note: normally, success is reported via success contexts.
Use this action only when imperative success handling is required.

### Use For

- advanced scripting, when exiting early is required
`;

    async exec() {}

    leave() {
        this.$script.setStatus('success');
    }
}
