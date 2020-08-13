import { stringConfig, Configuration, Logger, Target } from '@automationcloud/cdp';
import { inject, injectable } from 'inversify';
import { BrowserService } from './browser';
import { SessionHandler } from '../session';

const USER_AGENT = stringConfig(
    'USER_AGENT_DESKTOP',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/84.0.4147.89 Safari/537.36',
);
const USER_AGENT_PLATFORM = stringConfig('USER_AGENT_PLATFORM_DESKTOP', 'Win32');

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
