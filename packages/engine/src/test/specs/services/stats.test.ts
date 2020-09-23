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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('StatsService', () => {
    it('collects origins', async () => {
        await runtime.goto('/index.html');
        await runtime.goto('/click.html');
        assert.deepEqual(runtime.$stats.visitedOrigins, ['http://localhost:3007']);
    });

    it('collects number of http requests', async () => {
        await runtime.goto('/index.html');
        assert.equal(runtime.$stats.httpRequestsCount, 2);
    });
});
