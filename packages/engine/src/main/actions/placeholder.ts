import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class PlaceholderAction extends Action {
    static $type = 'placeholder';
    static $icon = 'far fa-circle';
    static $hidden = true;
    static $help = `
Use this action to get quick access to pipeline configuration and deciding what to do with its results later.

After pipeline is congifured, use Change Type to convert the placeholder into one of the actions.

Running the placeholder will result in an error.
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {
        throw util.scriptError('Cannot run a placeholder. Please convert it into a specific action.');
    }
}
