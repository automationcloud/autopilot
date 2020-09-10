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
        apiLogin: app.get(ctl.ApiLoginController),
        appMenu: app.get(ctl.AppMenuController),
        chromeDownload: app.get(ctl.ChromeDownloadController),
        emulation: app.get(ctl.EmulationController),
        expandable: app.get(ctl.ExpandableController),
        extDev: app.get(ctl.ExtensionDevController),
        extReg: app.get(ctl.ExtensionRegistryController),
        project: app.get(ctl.ProjectController),
        roxi: app.get(ctl.RoxiController),
        diff: app.get(ctl.ScriptDiffController),
        scriptReport: app.get(ctl.ScriptReportController),
        settings: app.get(ctl.SettingsController),
        tools: app.get(ctl.ToolsController),
    };
}
