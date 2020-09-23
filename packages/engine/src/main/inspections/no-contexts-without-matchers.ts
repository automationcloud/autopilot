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

import { InspectionReport, InspectionLevel, ContextInspection } from '../inspection';
import { Context } from '../context';

export class NoContextsWithoutMatchers extends ContextInspection {

    *inspect(context: Context): Iterable<InspectionReport> {
        if (context.type !== 'context') {
            return;
        }
        if (context.matchers.length === 0) {
            yield {
                name: 'no-contexts-without-matchers',
                level: InspectionLevel.Error,
                message: `Context should have at least 1 matcher`,
            };
        }
    }

}
