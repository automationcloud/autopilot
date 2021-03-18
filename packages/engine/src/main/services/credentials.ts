import { injectable } from 'inversify';

import { util } from '..';
import { CredentialsData } from '../model';

@injectable()
export class CredentialsService {

    protected async resolveCredentials(_token: unknown): Promise<CredentialsData | null> {
        return null;
    }

    async getCredentials(token: unknown): Promise<CredentialsData> {
        const credentials = await this.resolveCredentials(token);
        if (credentials == null) {
            throw util.createError({
                code: 'CredentialsNotFound',
                message: `No valid credentials found. You may need to log in with your account details.`,
                retry: false,
            });
        }
        return credentials;
    }

}
