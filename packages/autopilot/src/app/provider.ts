import { App } from './app';
import * as ctl from './controllers';

/**
 * Creates Vue provider which allows injecting
 * controllers in Vue components.
 *
 * See https://vuejs.org/v2/api/#provide-inject
 */
export function createControllerProvider(app: App) {
    return {
        extReg: app.get(ctl.ExtensionRegistryController),
        extDev: app.get(ctl.ExtensionDevController),
        apiLogin: app.get(ctl.ApiLoginController),
    };
}
