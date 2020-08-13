import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomChildText extends DomExtractPipe {
    static $type = 'DOM.getChildText';
    static $help = `
Returns text content of direct text node children of an element, ignoring nested elements.

### Use For

- accessing text content of immediate children when semantic markup does not allow
for more precise targeting
`;

    getDatum(info: RemoteElementInfo) {
        return info.childText;
    }
}
