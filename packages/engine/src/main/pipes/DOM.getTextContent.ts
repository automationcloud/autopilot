import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomTextContent extends DomExtractPipe {
    static $type = 'DOM.getTextContent';
    static $help = `
Returns \`textContent\` DOM property of elements.

### Use For

- reading \`textContent\` specifically
  (i.e. when fallback logic of Extract Text produces incorrect or unwanted results)
`;

    getDatum(info: RemoteElementInfo) {
        return info.textContent;
    }
}
