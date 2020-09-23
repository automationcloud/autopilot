// Copyright 2020 Ubio Limited
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

export class DomIsDisabled extends DomExtractPipe {
    static $type = 'DOM.isDisabled';
    static $help = `
For each element returns the value of its \`disabled\` DOM property.

### Use For

- asserting that buttons or other form controls are interactable
`;

    getDatum(info: RemoteElementInfo) {
        return info.disabled;
    }
}
