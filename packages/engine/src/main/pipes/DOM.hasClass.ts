import { params } from '../model';
import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomHasClass extends DomExtractPipe {
    static $type = 'DOM.hasClass';
    static $help = `
Returns \`true\` if element contains specified class name, false otherwise.

### Use For

- filtering
- reading boolean state from class names
`;

    @params.String({ source: 'classList' })
    className: string = '';

    getDatum(info: RemoteElementInfo) {
        const className = this.className;
        return info.classList.includes(className);
    }
}
