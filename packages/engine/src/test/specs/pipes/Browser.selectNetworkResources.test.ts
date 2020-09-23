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

describe('Pipes: other/select-network-resources', () => {
    it('select-network-resources pipe', async () => {
        await runtime.goto('/network/ajax-seq.html');
        const result = await runtime.runPipes([
            {
                type: 'Browser.selectNetworkResources',
                hostnameRegexp: '(?<!\\/).*',
                pathnameRegexp: '.*',
            },
        ]);
        assert(result.length > 0);
        assert.equal(result.values().next().value.value.request.url, runtime.page.url());
    });
});
