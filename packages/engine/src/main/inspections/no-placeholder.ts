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

import { Action } from '../action';
import { ActionInspection, InspectionLevel, InspectionReport } from '../inspection';

export class NoPlaceholders extends ActionInspection {

    *inspect(action: Action): Iterable<InspectionReport> {
        if (action.type === 'placeholder') {
            yield {
                name: 'no-placeholder',
                level: InspectionLevel.Error,
                message: `Placeholders are not allowed`,
            };
        }
    }

}
