import { App } from './app';
import * as ctl from './controllers';
import { BrowserService } from '@automationcloud/engine';

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
        browser: app.get(BrowserService),
        chromeDownload: app.get(ctl.ChromeDownloadController),
        chromeManager: app.get(ctl.ChromeManagerController),
        datasets: app.get(ctl.DatasetsController),
        diff: app.get(ctl.ScriptDiffController),
        emulation: app.get(ctl.EmulationController),
        expandable: app.get(ctl.ExpandableController),
        extDev: app.get(ctl.ExtensionDevController),
        extReg: app.get(ctl.ExtensionRegistryController),
        firstRun: app.get(ctl.FirstRunController),
        inspect: app.get(ctl.InspectController),
        project: app.get(ctl.ProjectController),
        protocol: app.get(ctl.ProtocolController),
        roxi: app.get(ctl.RoxiController),
        scriptReport: app.get(ctl.ScriptReportController),
        settings: app.get(ctl.SettingsController),
        tools: app.get(ctl.ToolsController),
    };
}
