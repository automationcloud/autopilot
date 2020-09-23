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
