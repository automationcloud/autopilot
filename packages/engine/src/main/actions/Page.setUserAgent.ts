import { Action } from '../action';
import { params } from '../model';
import { UserAgentService } from '../services/user-agent';
import { Pipeline } from '../pipeline';
// import * as util from '../util';
import { JsonSchema } from '../schema';

export class SetUserAgentAction extends Action {
    static $type = 'Page.setUserAgent';
    static $icon = 'fas fa-user-secret';
    static $help = `
Overrides User Agent and Platform visible to web pages.
`;
    static $schema: JsonSchema = {
        type: 'object',
        required: ['userAgent'],
        properties: {
            userAgent: { type: 'string' },
            platform: { type: 'string' },
        },
    };

    @params.Pipeline()
    pipeline: Pipeline = [
        {
            type: 'Value.getJson',
            value: JSON.stringify({
                userAgent: this.$userAgent.getDefaultUserAgent(),
                platform: this.$userAgent.getDefaultPlatform(),
            }, null, 2)
        }
    ] as any;

    init(spec: any) {
        super.init(spec);
        const { userAgent, platform } = spec;
        if (userAgent || platform) {
            this.pipeline = new Pipeline(this, 'pipeline', [
                {
                    type: 'Value.getJson',
                    value: JSON.stringify({ userAgent, platform })
                }
            ]);
        }
    }

    get $userAgent() {
        return this.$container.get(UserAgentService);
    }

    async exec() {
        const el = await this.retry(() => this.selectOne(this.pipeline));
        const {
            userAgent = this.$userAgent.getDefaultUserAgent(),
            platform = this.$userAgent.getDefaultPlatform(),
        } = this.validate(el.value);
        this.$userAgent.set(userAgent, platform);
        await this.$userAgent.applyToAllTargets();
    }
}
