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

import { fuzzyMatch } from '../main';
import assert from 'assert';

describe('Fuzzy match', () => {

    const suite = {
        'match whole words': [
            { query: 'text', source: 'getText', matches: [3, 4, 5, 6] },
            { query: 'text', source: 'get-text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'get_text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'Get Text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'no match', matches: [] },
        ],
        'match the beginning of tokens': [
            { query: 'gt', source: 'getText', matches: [0, 3] },
            { query: 'gt', source: 'get-text', matches: [0, 4] },
            { query: 'gt', source: 'get_text', matches: [0, 4] },
            { query: 'gt', source: 'Get Text', matches: [0, 4] },
            { query: 'gt', source: 'no match', matches: [] },
        ],
        'match wildcard': [
            { query: 'text', source: 'batchExtract', matches: [2, 5, 6, 7] },
            { query: 'text', source: 'batch-extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'batch_extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'Batch Extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'No match', matches: [] },
        ],
    };

    for (const [title, cases] of Object.entries(suite)) {
        describe(title, () => {
            for (const testCase of cases) {
                const match = testCase.matches.length > 0;
                const sym = match ? '✓' : '✗';
                it(`${sym} ${testCase.query} -> ${testCase.source}`, () => {
                    const res = fuzzyMatch(testCase.query, testCase.source);
                    assert.deepEqual(res.matches, testCase.matches);
                    assert(match ? res.score > 0 : res.score === 0);
                });
            }
        });
    }

});
