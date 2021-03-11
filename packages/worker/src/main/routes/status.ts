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

import { Get, Router } from '@ubio/framework';
import { injectable } from 'inversify';

// eslint-disable-next-line import/no-commonjs
const pkg = require('../../../package.json');

@injectable()
export class StatusRouter extends Router {
    @Get({
        path: '/status',
        responses: {
            200: {
                schema: {
                    type: 'object',
                    properties: {
                        version: { type: 'string' },
                    },
                },
            },
        },
    })
    async status() {
        return {
            version: pkg.version,
        };
    }
}
