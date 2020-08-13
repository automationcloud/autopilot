import { DomExtractPipe } from './_extract';
import { RemoteElementInfo } from '@automationcloud/cdp';

export class DomText extends DomExtractPipe {
    static $type = 'DOM.getText';
    static $help = `
Returns text extracted from DOM element by reading its
innerText, textContent or value (whichever first is defined)
and normalizing the whitespace.

### Use For

- general purpose text extraction from the page

### See Also

- DOM.getValue, DOM.getInnerText, DOM.getTextContent:
  for more specialized extractors that don't fallback over multiple text sources
`;

    getDatum(info: RemoteElementInfo) {
        return info.text;
    }
}
