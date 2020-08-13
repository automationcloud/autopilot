import { injectable } from 'inversify';
import { RegistryService } from '@automationcloud/engine';

@injectable()
export class RegistryServiceMock extends RegistryService {

    async listExtensions() {
        return [];
    }

}
