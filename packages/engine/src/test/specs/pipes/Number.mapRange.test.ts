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

import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/map-range', () => {
    it('maps numbers to specified ranges', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([0, 1, 2, 17, 18]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Number.mapRange',
                ranges: [
                    { value: 'infant', min: 0, max: 2 },
                    { value: 'child', min: 2, max: 18 },
                    { value: 'adult', min: 18, max: null },
                ],
            },
        ]);
        assert.equal(results.length, 5);
        assert.deepEqual(
            results.map(_ => _.value),
            ['infant', 'infant', 'child', 'child', 'adult'],
        );
    });
});
