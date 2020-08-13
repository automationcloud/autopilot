import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomIsChecked extends DomExtractPipe {
    static $type = 'DOM.isSelected';
    static $help = `
For each element returns the value of its \`selected\` or \`checked\` DOM property.

### Use For

- extracting boolean values of checkboxes, radio buttons and \`option\` elements
`;

    getDatum(info: RemoteElementInfo) {
        return info.nodeName === 'OPTION' ? !!info.selected : !!info.checked && !info.indeterminate;
    }
}
