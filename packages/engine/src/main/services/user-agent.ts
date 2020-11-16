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

import { stringConfig, Configuration, Logger, Target } from '@automationcloud/cdp';
import { inject, injectable } from 'inversify';
import { BrowserService } from './browser';
import { SessionHandler } from '../session';

const USER_AGENT = stringConfig(
    'USER_AGENT',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/86.0.4240.198 Safari/537.36',
);
const USER_AGENT_PLATFORM = stringConfig('USER_AGENT_PLATFORM', 'Win32');

@injectable()
@SessionHandler()
export class UserAgentService {
    userAgent: string;
    platform: string;

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(Configuration)
        protected config: Configuration,
        @inject(Logger)
        protected logger: Logger,
    ) {
        browser.on('targetAttached', (target: Target) => this.applyToTarget(target));
        this.userAgent = this.getDefaultUserAgent();
        this.platform = this.getDefaultPlatform();
    }

    async onSessionStart() {
        this.userAgent = this.getDefaultUserAgent();
        this.platform = this.getDefaultPlatform();
        await this.applyToAllTargets();
    }

    async onSessionFinish() {}

    set(userAgent: string, platform: string) {
        this.userAgent = userAgent;
        this.platform = platform;
    }

    async applyToAllTargets() {
        for (const target of this.browser.attachedTargets()) {
            await this.applyToTarget(target);
        }
    }

    async applyToTarget(target: Target): Promise<void> {
        try {
            const page = await this.browser.getPageForTarget(target.targetId);
            if (!page) {
                return;
            }
            const { userAgent, platform } = this;
            await page.send('Network.setUserAgentOverride', { userAgent, platform });
            await page.send('Emulation.setUserAgentOverride', { userAgent, platform }).catch(() => {});
        } catch (error) {
            if (['CdpDisconnected', 'CdpTargetDetached'].includes(error.name)) {
                // We're not interested in transient frames which unload too quickly
                return;
            }
            this.logger.warn('Failed to apply User Agent overrides', { error });
        }
    }

    getDefaultUserAgent() {
        return this.config.get(USER_AGENT);
    }

    getDefaultPlatform() {
        return this.config.get(USER_AGENT_PLATFORM);
    }

}
