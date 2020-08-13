import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomValue extends DomExtractPipe {
    static $type = 'DOM.getValue';
    static $help = `
Returns \`value\` DOM property of elements.

### Use For

- reading \`value\` specifically
  (i.e. when fallback logic of Text produces incorrect or unwanted results)
`;

    getDatum(info: RemoteElementInfo) {
        return info.value;
    }
}
