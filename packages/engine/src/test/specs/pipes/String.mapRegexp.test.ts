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

import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/map-regexp', () => {
    it('maps strings to specified regexes', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['Visa', 'Visa Electron', 'MasterCard']),
            },
            { type: 'List.fromArray' },
            {
                type: 'String.mapRegexp',
                patterns: [
                    { value: 'vi', regexp: 'visa', flags: 'ig' },
                    { value: 'mc', regexp: 'MasterCard', flags: 'ig' },
                ],
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(
            results.map(_ => _.value),
            ['vi', 'vi', 'mc'],
        );
    });
});
