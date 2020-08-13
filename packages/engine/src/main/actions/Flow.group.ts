import { Action } from '../action';

export class GroupAction extends Action {
    static $type = 'Flow.group';
    static $icon = 'fas fa-folder';
    static $help = `
Groups a set of actions.

### Use For

- structuring and organizing scripts
`;

    hasChildren() {
        return true;
    }

    async exec() {}

    afterRun() {
        this.enter();
    }
}
