// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { RemoteElementInfo } from '@automationcloud/cdp';

import { DomExtractPipe } from './_extract';

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
