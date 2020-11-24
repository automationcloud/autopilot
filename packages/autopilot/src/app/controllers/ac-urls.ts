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

import { injectable } from 'inversify';
import { controller } from '../controller';


@injectable()
@controller()
export class AcUrlsController {
    urls: Map<string, string> = new Map([
        ['home', 'https://www.automationcloud.net/'],
        ['community', 'https://community.automationcloud.net/'],
        ['robotSchool', 'https://robotschool.dev'],
        ['dashboard', 'https://dashboard.automationcloud.net/'],
        ['register', 'https://www.automationcloud.net/pricing']
    ]);

    async init() {}

    get(key: string): string {
        return this.urls.get(key) ?? '';
    }
}
