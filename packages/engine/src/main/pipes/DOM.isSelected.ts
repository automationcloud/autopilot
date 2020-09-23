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
