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
import { LayoutController } from './layout';
import { SettingsController } from './settings';


const WELCOME_SHOWN = booleanConfig('WElCOME_SHOWN', true);

@injectable()
@controller({ alias: 'welcome' })
export class WelcomeController {
    currentIndex: number = -1;

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(LayoutController)
        protected layout: LayoutController,
    ) {
    }

    async init() {
        // TODO: just need to make sure this layout is available and activated
        // probably this should be done in layout manager.
        if (this.welcomeShown()) {
            this.currentIndex = 0;
            this.layout.workspaces.unshift({
                name: 'Welcome',
                layout: {
                    type: 'row',
                    children: [
                        { type: 'viewport', viewportId: 'script-flow' },
                        { type: 'viewport', viewportId: 'script-editor' },
                    ],
                },
            });
            this.layout.activateWorkspace(this.layout.workspaces.length - 1);
        }
    }

    next() {
        if (this.currentIndex === this.contents.length - 1) {
            this.hide();
        } else {
            this.currentIndex += 1;
        }
    }

    hide() {
        this.currentIndex = -1;
        this.setWelcomeShown(false);
    }

    welcomeShown() {
        return this.settings.get(WELCOME_SHOWN);
    }

    protected setWelcomeShown(value: boolean) {
        this.settings.setEntries([['WELCOME_SHOWN', String(value)]]);
    }

    getWelcomeAutomation() {
        return { ...WELCOME_AUTOMATION };
    }

    getCurrentContent() {
        return this.currentIndex >= 0 ? this.contents[this.currentIndex] : null;
    }

    get contents() {
        return [
            {
                id: 'workspace',
                title: 'The Workspace Menu',
                message: [
                    'Workspaces contain different Panels of tools.',
                    'We\'ve set up default Workspaces like this one for scripting. You can also configure your own.'
                ],
            },
            {
                id: 'script-panel',
                title: 'The Script panel',
                message: ['Define contexts which match pages and then add Actions which perform automation tasks.'],
            },
            {
                id: 'editor-panel',
                title: 'The Editor panel',
                message: [
                    'Compose Pipelines to do things in each Action',
                    'The last pipe\'s output provides input to the next',
                ],
            },
            {
                id: 'playback',
                title: 'The Play bar',
                message: [
                    'Control and debug playback of your script in the browser.'
                ],
                image: 'resources/playback.png',
            },
            {
                id: 'login',
                title: 'Your Automation Cloud Account',
                message: ['Sign in here to save your automations. Run them in the Automation Cloud later, at scale'],
            },
            {
                id: 'play-script',
                title: 'Play your first script',
                message: [
                    'Clock the Play button to start playing this script.',
                    'Go on. Dare you!',
                ],
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
        contents: {
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
