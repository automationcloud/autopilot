// Copyright 2021 UBIO Limited
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

import assert from 'assert';

import { buildConnectors, ConnectorSpec } from '../../main';

describe('buildConnectors', () => {
    const spec: ConnectorSpec = {
        baseUrl: 'https://api.example/1.1/',
        icon: 'fa-example',
        auth: [
            {
                type: 'bearer',
            }
        ],
        endpoints: [
            {
                name: 'collections.entries',
                description: 'I am helpful',
                path: 'max_position',
                method: 'GET',
                parameters: [
                    {
                        key: 'content-type',
                        location: 'header',
                        description: 'The identifier of the Collection for which to return results.',
                        required: true
                    },
                    {
                        key: 'count',
                        location: 'body',
                        description: 'Specifies the maximum number of results to include in the response. Specify a count between 1 and 200. A next_cursor value will be provided in the response if additional results are available.',
                        required: false
                    }
                ]
            },
        ]
    };
    it('builds actions', async () => {
        const actions = buildConnectors('Example', spec);
        const ConnectorAction = actions['Example.collections.entries.get'];
        assert.ok(ConnectorAction);
        assert.equal(ConnectorAction.$type, 'Example.collections.entries.get');
        assert.equal(ConnectorAction.$icon, 'fab fa-example');
        assert.equal(ConnectorAction.$help, 'I am helpful');
    });

    it('skips invalid spec', () => {
        const invalidSpec: any = {
            ...spec,
            endpoints: [
                {
                    name: 'invalid',
                    parameters: [{
                        key: 'i do not have location'
                    }]
                }
            ]
        };
        const result = buildConnectors('Example', invalidSpec);
        const actions = Object.entries(result);
        assert.ok(actions.length === 0);
    });
});
