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

describe('Pipes: value/format-date', () => {
    it('formats date', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2018-06-05 18:44:32',
            },
            {
                type: 'Date.format',
                format: 'HH:mm YY MMM DD ddd',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, '18:44 18 Jun 05 Tue');
    });

    it('throws if input is not a valid date', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '34',
                },
                {
                    type: 'Date.format',
                    format: '',
                },
            ]);
        });
    });

    it('throws if input is not a string', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '40',
                    dataType: 'number',
                },
                {
                    type: 'Date.format',
                    format: '',
                },
            ]);
        });
    });
});
