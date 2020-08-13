import { Action } from './action';
import { Pipeline } from './pipeline';
import { params } from './model';

export class DefinitionAction extends Action {
    static $type = 'definition';
    static $category = 'Basic';
    static $icon = 'fas fa-cubes';
    static $hidden = true;
    static $help = `
Defines a pipeline which can subsequently be used in other actions via Use Definition pipe.

### Use For

- extracting common functionality (e.g. inbound and outbound flight selection would share common parts for extracting flight information, prices, etc.)
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {}
}
