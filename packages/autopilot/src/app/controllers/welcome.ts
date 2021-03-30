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

import { controller } from '../controller';
import { SettingsController } from './settings';

@injectable()
@controller({ alias: 'welcome' })
export class WelcomeController {
    currentIndex: number;
    shown: boolean; // TODO: move it to settings

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {
        this.currentIndex = 0;
        this.shown = true;
    }

    async init() { }

    next() {
        if (this.currentIndex === this.contents.length - 1) {
            this.hide();
        } else {
            this.currentIndex += 1;
        }
    }

    hide() {
        this.currentIndex = 0;
        this.shown = false;
    }

    getWelcomeAutomation() {
        return { ...WELCOME_AUTOMATION };
    }

    getCurrentContent() {
        return this.contents[this.currentIndex] ?? null;
    }

    get contents() {
        return [
            {
                title: 'The Workspace Menu',
                selector: `[data-bubble-id='workspace']`,
                message: [
                    'Workspaces contain different Panels of tools.',
                    'We\'ve set up default Workspaces like this one for scripting. You can also configure your own.'
                ],
                orientation: 'top',
                alignment: 'start'
            },
            {
                title: 'The Script panel',
                selector: `[data-anchor='viewport-scriptFlow-e']`,
                message: ['Define contexts which match pages and then add Actions which perform automation tasks.'],
                orientation: 'left',
                alignment: 'middle'
            },
            {
                title: 'The Editor panel',
                selector: `[data-anchor='viewport-scriptEditor-w']`,
                message: [
                    'Compose Pipelines to do things in each Action',
                    'The last pipe\'s output provides input to the next',
                ],
                orientation: 'right',
                alignment: 'middle'
            },
            {
                title: 'The Play bar',
                selector: `[data-bubble-id='playback']`,
                message: [
                    'Control and debug playback of your script in the browser.'
                ],
                image: 'resources/playback.png',
                orientation: 'bottom',
                alignment: 'middle'
            },
            {
                title: 'Your Automation Cloud Account',
                selector: `[data-bubble-id='login']`,
                message: ['Sign in here to save your automations. Run them in the Automation Cloud later, at scale'],
                orientation: 'top',
                alignment: 'end'
            },
            {
                title: 'Play your first script',
                selector: `[data-bubble-id='play-script']`,
                message: [
                    'Clock the Play button to start playing this script.',
                    'Go on. Dare you!',
                ],
                orientation: 'bottom',
                alignment: 'start'
            }
        ];
    }
}

const WELCOME_AUTOMATION = {
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
                    data: 'https://automation.cloud/welcome'
                }
            ],
            excluded: false
        }
    ]
};
