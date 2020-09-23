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

describe('Pipes: dom/batch-extract', () => {
    it('returns a batch info', async () => {
        await runtime.goto('/integration/flights.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: '.flight',
            },
            {
                type: 'DOM.batchExtract',
                properties: [
                    {
                        key: 'from',
                        selector: '.flight-from',
                    },
                    {
                        key: 'to',
                        selector: '.flight-to',
                    },
                    {
                        key: 'price',
                        selector: '.flight-price',
                    },
                ],
            },
        ]);
        assert.equal(results.length, 162);
        for (const res of results) {
            assert.ok(res.value.from);
            assert.ok(res.value.to);
            assert.ok(res.value.price);
        }
    });
});
