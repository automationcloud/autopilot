import { Router, Get } from '@ubio/framework';
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
