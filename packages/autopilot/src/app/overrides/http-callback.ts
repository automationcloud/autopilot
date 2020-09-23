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

import {
    numberConfig,
    Configuration,
    HttpCallbackService,
    HttpCallbackResponse,
    Exception,
} from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { ipcRenderer, shell } from 'electron';
import { controlServerPort } from '../globals';
import { StorageController } from '../controllers';
import { EventBus } from '../event-bus';

const HTTP_CALLBACK_TIMEOUT = numberConfig('HTTP_CALLBACK_TIMEOUT', 60000);

@injectable()
@controller()
export class AutopilotHttpCallbackService extends HttpCallbackService {

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(EventBus)
        protected events: EventBus,
    ) {
        super();
    }

    async init() {
        ipcRenderer.on('httpCallbackResult', (_ev, result) => this.events.emit('httpCallbackResult', result));
    }

    get timeout() {
        return this.config.get(HTTP_CALLBACK_TIMEOUT);
    }

    getCallbackUrl() {
        return `http://localhost:${controlServerPort}/httpCallback`;
    }

    async open(url: string | URL): Promise<HttpCallbackResponse> {
        const targetUrl = url.toString().replace(/\{CALLBACK_URL\}/g, this.getCallbackUrl());
        await shell.openExternal(targetUrl);
        return await this.waitForCallbackResult();
    }

    protected async waitForCallbackResult(): Promise<any> {
        return await new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timer);
                this.events.removeListener('httpCallbackResult', onCallbackResult);
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new Exception({
                    name: 'HttpCallbackTimeout',
                    message: 'Timeout waiting for http callback response',
                }));
            }, this.timeout);
            const onCallbackResult = (payload: any) => {
                cleanup();
                resolve(payload);
            };
            this.events.addListener('httpCallbackResult', onCallbackResult);
        });
    }

}
