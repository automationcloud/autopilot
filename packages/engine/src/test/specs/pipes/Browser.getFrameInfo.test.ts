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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('Browser.getFrameInfo', () => {
    it('returns frame information', async () => {
        await runtime.goto('/iframes/top.html');
        await runtime.page.waitForLoad();
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#frame1',
            },
            { type: 'DOM.iframe' },
            {
                type: 'Browser.getFrameInfo',
            },
        ]);
        assert.equal(results.length, 1);
        assert.ok(results[0].value.frameId);
        assert.ok(results[0].value.url);
        assert.ok(results[0].value.url.endsWith('/first-level.html'));
        assert.ok(results[0].value.ready);
        assert.ok(results[0].value.loaded);
        assert.ok(!results[0].value.failed);
    });
});
