import { injectable } from 'inversify';
import { controller } from '../controller';

@injectable()
@controller()
export class ModalsController {
    currentModalName: string = '';

    async init() {}

    show(name: string) {
        this.currentModalName = name;
    }

    hide() {
        this.currentModalName = '';
    }

}
