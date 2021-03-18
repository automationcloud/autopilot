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

import { inject, injectable } from 'inversify';
import { booleanConfig } from '../../../../cdp/out/main';
import { controller } from '../controller';
import { SettingsController } from './settings';


const SHOW_WELCOME = booleanConfig('SHOW_WELCOME', true);

@injectable()
@controller({ 'alias': 'welcome' })
export class WelcomeController {


    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {
    }

    async init() {

    }

    showWelcome() {
        return this.settings.get(SHOW_WELCOME);
    }

    setFirstRun(value: boolean) {
        this.settings.setEntries([['SHOW_WELCOME', String(value)]]);
    }

    getWelcomeAutomation() {
        return { ...welcomeAutomation };
    }
}


const welcomeAutomation = {
    metadata: {
        version: null,
        serviceId: null,
        serviceName: 'Welcome',
        domainId: 'Generic',
        draft: true,
        bundleIndex: 0
    },
    script: {
        dependencies: [],
        id: '1326e401-7801-4064-94fa-9bc05d546989',
        contexts: {
            items: [
                {
                    id: '7865046c-d354-44e5-afb0-23f49ace2e80',
                    name: '<main>',
                    type: 'main',
                    flowType: 'normal',
                    errorCode: null,
                    limit: 1,
                    matchMode: 'fast',
                    resolve3dsecure: true,
                    matchers: {
                        items: []
                    },
                    definitions: {
                        items: []
                    },
                    children: {
                        items: [
                            {
                                id: 'ecdeecae-5b53-4813-b580-d6d65bf02fb3',
                                label: '',
                                notes: '',
                                rejectHttpErrors: true,
                                rejectNetworkErrors: true,
                                openNewTab: false,
                                closeOtherTabs: false,
                                timeout: 30000,
                                children: {
                                    items: []
                                },
                                pipeline: {
                                    items: [
                                        {
                                            id: 'd85cd609-de76-42ef-b230-7b9f322d8ff5',
                                            label: '',
                                            notes: '',
                                            enabled: true,
                                            inputKey: 'url',
                                            type: 'Value.getInput'
                                        }
                                    ]
                                },
                                type: 'Page.navigate'
                            }
                        ]
                    }
                },
                {
                    id: '5ac1ae33-babb-46db-8b96-b334d0a9f828',
                    name: 'WelcomePage',
                    type: 'context',
                    flowType: 'success',
                    errorCode: null,
                    limit: 1,
                    matchMode: 'fast',
                    resolve3dsecure: true,
                    matchers: {
                        items: [
                            {
                                id: 'c5f273b5-141f-4e06-94ef-f60ddab8cd51',
                                label: 'Woohoo robot',
                                notes: '',
                                children: {
                                    items: []
                                },
                                pipeline: {
                                    items: [
                                        {
                                            id: '4919e567-ed2a-43f5-9710-603cfad7048b',
                                            label: '',
                                            notes: '',
                                            enabled: true,
                                            selector: '.woohoo-robot',
                                            optional: false,
                                            type: 'DOM.queryOne'
                                        },
                                        {
                                            id: '47507de1-488f-486a-bc16-855833c3b203',
                                            label: '',
                                            notes: '',
                                            enabled: true,
                                            type: 'DOM.isVisible'
                                        }
                                    ]
                                },
                                type: 'matcher'
                            }
                        ]
                    },
                    definitions: {
                        items: []
                    },
                    children: {
                        items: []
                    }
                }
            ]
        },
        blockedUrlPatterns: []
    },
    bundles: [
        {
            name: 'Input data',
            inputs: [
                {
                    key: 'url',
                    data: 'https: //automation.cloud/welcome'
                }
            ],
            excluded: false
        }
    ]
};
