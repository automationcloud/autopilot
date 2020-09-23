// Copyright 2020 Ubio Limited
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

import { remote, MenuItemConstructorOptions, ipcRenderer } from 'electron';
import { injectable, inject } from 'inversify';
import { EventBus } from '../event-bus';
import debounce from 'debounce';
import { booleanConfig, ProxyService } from '@automationcloud/engine';
import { SettingsController } from './settings';
import { ViewportManager } from '../managers/viewport-manager';
import { ProjectController } from './project';
import { dom, helpers } from '../util';
import { Viewport } from '../viewport';
import { LayoutManager } from '../managers/layout-manager';
import { PlaybackManager } from '../managers/playback-manager';
import { EmulationController } from './emulation';
import { ToolsController } from './tools';
import { controller } from '../controller';
import { ProtocolController } from './protocol';

const UI_HIDE_MENU = booleanConfig('UI_HIDE_MENU', true);

const { Menu } = remote;

@injectable()
@controller()
export class AppMenuController {
    profiles: Array<{ id: string; name: string }> = [];

    constructor(
        @inject(EventBus)
        protected events: EventBus,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(ViewportManager)
        protected viewports: ViewportManager,
        @inject(LayoutManager)
        protected layout: LayoutManager,
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(PlaybackManager)
        protected playback: PlaybackManager,
        @inject(EmulationController)
        protected emulation: EmulationController,
        @inject(ToolsController)
        protected tools: ToolsController,
        @inject(ProtocolController)
        protected protocol: ProtocolController,
        @inject(ProxyService)
        protected proxy: ProxyService,
    ) {
        this.events.on('initialized', () => this.renderMenu());
        this.events.on('windowFocused', () => this.renderMenu());
        this.events.on('activeViewportChanged', () => this.renderMenu());
        this.events.on('viewportUpdated', () => this.renderMenu());
        this.events.on('commandExecuted', () => this.renderMenu());
        this.events.on('undoExecuted', () => this.renderMenu());
        this.events.on('redoExecuted', () => this.renderMenu());
        this.events.on('focusChanged', () => this.renderMenu());
        this.events.on('selectionChanged', () => this.renderMenu());
        this.events.on('settingsUpdated', () => this.renderMenu());

        this.renderMenu = debounce(this.renderMenu.bind(this), 100);
        this.refreshProfiles();
        this.updateAutoHideMenu();
    }

    async init() {}

    refreshProfiles() {
        const settings = remote.require('./settings');
        this.profiles = settings.getAllProfiles();
    }

    renderMenu() {
        const items = [...this.buildMenuItems()];
        const menu = Menu.buildFromTemplate(items);
        Menu.setApplicationMenu(menu);
    }

    updateAutoHideMenu() {
        const uiHideMenu = this.settings.get(UI_HIDE_MENU);
        const wnd = remote.getCurrentWindow();
        // wnd.setAutoHideMenuBar(uiAutoHideMenu);
        wnd.setMenuBarVisibility(!uiHideMenu);
    }

    *buildMenuItems(): Iterable<MenuItemConstructorOptions> {
        const viewport = this.viewports.getActive();
        yield {
            label: 'Autopilot',
            submenu: [...this.buildAutopilotMenu()],
        };
        yield {
            label: 'File',
            submenu: [...this.buildFileMenu()],
        };
        yield {
            label: 'Edit',
            submenu: [...this.buildEditMenu(viewport)],
        };
        yield {
            label: 'View',
            submenu: [...this.buildViewMenu(viewport)],
        };
        yield {
            label: 'Playback',
            submenu: [...this.buildPlaybackMenu()],
        };
        yield {
            label: 'Tools',
            submenu: [...this.buildToolsMenu()],
        };
        if (viewport) {
            yield* viewport.getMenu();
        }
        yield {
            label: 'Profiles',
            submenu: [...this.buildProfilesMenu()],
        };
    }

    *buildAutopilotMenu(): Iterable<MenuItemConstructorOptions> {
        yield {
            label: 'Reload App',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => location.reload(),
        };
        yield {
            label: 'Toggle Developer Tools',
            accelerator: 'CmdOrCtrl+Esc',
            click: () => {
                const wnd = remote.getCurrentWindow();
                wnd.webContents.toggleDevTools();
            },
        };
        yield { role: 'quit' };
    }

    *buildFileMenu(): Iterable<MenuItemConstructorOptions> {
        yield {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.project.newProject(),
        };
        yield {
            label: 'Open Project...',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.project.openProject(),
        };
        yield {
            label: 'Save Project',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.project.saveProject(),
        };
        yield {
            label: 'Save Project As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.project.saveProjectAs(),
        };
        if (this.project.autosaveFiles.length > 0) {
            const groups = helpers.groupBy(this.project.autosaveFiles, file => file.split('_')[0]);
            yield {
                label: 'Restore Autosave',
                submenu: groups.map(([date, files]) => {
                    return {
                        label: date,
                        submenu: files.map(f => {
                            return {
                                label: f
                                    .substring(date.length + 1)
                                    .replace(/_/, ' ')
                                    .replace(/\.json$/, ''),
                                click: () => this.project.restoreAutosave(f),
                            };
                        }),
                    };
                }),
            };
        }
    }

    *buildEditMenu(viewport: Viewport<any> | null): Iterable<MenuItemConstructorOptions> {
        // Undo/redo
        if (viewport && !dom.isInputFocused()) {
            // App undo/redo is only rendered when text input not selected
            const undoCmd = viewport.getCommandBuffer().getLastCommand();
            const redoCmd = viewport.getCommandBuffer().getFutureCommand();
            yield {
                label: undoCmd ? `Undo ${undoCmd.title}` : 'Undo',
                enabled: undoCmd != null,
                click: () => viewport.getCommandBuffer().undo(),
                accelerator: 'CmdOrCtrl+Z',
            };
            yield {
                label: redoCmd ? `Redo ${redoCmd.title}` : 'Redo',
                enabled: redoCmd != null,
                click: () => viewport.getCommandBuffer().redo(),
                accelerator: 'CmdOrCtrl+Shift+Z',
            };
        } else {
            yield { role: 'undo' };
            yield { role: 'redo' };
        }
        yield { type: 'separator' };
        // Standard cut/copy/paste
        if (dom.isTextEditContext()) {
            yield* this.buildStandardEditMenu();
        }
        // Viewport-specific stuff
        if (viewport) {
            yield* viewport.getEditMenu();
        }
    }

    *buildStandardEditMenu(): Iterable<MenuItemConstructorOptions> {
        yield { role: 'cut' };
        yield { role: 'copy' };
        yield { role: 'paste' };
        yield { type: 'separator' };
        yield { role: 'selectAll' };
    }

    *buildViewMenu(viewport: Viewport<any> | null): Iterable<MenuItemConstructorOptions> {
        yield {
            label: 'Switch workspace',
            submenu: this.layout.workspaces.map((w, i) => {
                return {
                    label: w.name,
                    click: () => this.layout.activateWorkspace(i),
                    accelerator: 'CmdOrCtrl+' + (i + 1),
                };
            }),
        };
        yield {
            label: 'Focus active viewport',
            click: () => this.viewports.focusActive(true),
            accelerator: 'Esc',
        };
        yield {
            label: 'Select next viewport',
            click: () => this.viewports.activateCycle(true),
            accelerator: 'CmdOrCtrl+`',
        };
        yield {
            label: 'Select previous viewport',
            click: () => this.viewports.activateCycle(false),
            accelerator: 'CmdOrCtrl+Shift+`',
        };
        yield {
            label: 'Select viewport to the left',
            click: () => this.viewports.activateInDirection('left'),
            accelerator: 'CmdOrCtrl+Shift+Left',
        };
        yield {
            label: 'Select viewport to the right',
            click: () => this.viewports.activateInDirection('right'),
            accelerator: 'CmdOrCtrl+Shift+Right',
        };
        yield {
            label: 'Select viewport to the top',
            click: () => this.viewports.activateInDirection('top'),
            accelerator: 'CmdOrCtrl+Shift+Up',
        };
        yield {
            label: 'Select viewport to the bottom',
            click: () => this.viewports.activateInDirection('bottom'),
            accelerator: 'CmdOrCtrl+Shift+Down',
        };
        yield { type: 'separator' };
        yield { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' };
        yield { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' };
        yield { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' };
        yield { type: 'separator' };
        if (viewport) {
            yield { type: 'separator' };
            yield* viewport.getViewMenu();
        }
    }

    *buildPlaybackMenu(): Iterable<MenuItemConstructorOptions> {
        yield {
            label: 'Play Script',
            accelerator: 'F9',
            click: () => this.playback.playScript(),
        };
        yield {
            label: 'Play Context',
            accelerator: 'CmdOrCtrl+F9',
            click: () => this.playback.playContext(),
        };
        yield {
            label: 'Play Action and Advance',
            accelerator: 'CmdOrCtrl+Shift+Enter',
            click: () => this.playback.playAction(true),
        };
        yield {
            label: 'Debug Action',
            accelerator: 'CmdOrCtrl+Enter',
            click: () => this.playback.playAction(false),
        };
        yield {
            label: 'Match Contexts',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.playback.matchContexts(),
        };
        yield {
            label: 'Reset',
            accelerator: 'CmdOrCtrl+F12',
            click: () => this.playback.reset(),
        };
    }

    *buildToolsMenu(): Iterable<MenuItemConstructorOptions> {
        yield {
            type: 'checkbox',
            label: 'Emulate 2G connection',
            click: () => this.emulation.setThrottling('2g'),
            checked: this.emulation.throttlingMode === '2g',
        };
        yield {
            type: 'checkbox',
            label: 'Emulate 3G connection',
            click: () => this.emulation.setThrottling('3g'),
            checked: this.emulation.throttlingMode === '3g',
        };
        yield {
            type: 'checkbox',
            label: 'Disable network emulation',
            click: () => this.emulation.setThrottling('none'),
            checked: this.emulation.throttlingMode === 'none',
        };
        yield { type: 'separator' };
        yield {
            type: 'checkbox',
            label: 'Emulate Desktop',
            click: () => this.emulation.setEmulation('desktop'),
            checked: this.emulation.emulationMode === 'desktop',
        };
        yield {
            type: 'checkbox',
            label: 'Emulate Mobile',
            click: () => this.emulation.setEmulation('mobile'),
            checked: this.emulation.emulationMode === 'mobile',
        };
        yield {
            type: 'checkbox',
            label: 'Disable Device Emulation',
            click: () => this.emulation.setEmulation('disabled'),
            checked: this.emulation.emulationMode === 'disabled',
        };
        yield { type: 'separator' };
        yield {
            label: 'Refresh Protocol',
            click: () => this.protocol.forceRefresh(),
        };
        yield {
            label: 'Test Checkpoint',
            click: () => this.tools.testCheckpoint(),
        };
        yield {
            label: 'Save HTML Snapshot...',
            accelerator: 'CmdOrCtrl+Alt+Shift+S',
            click: () => this.tools.saveHtmlSnapshot(),
        };
        yield {
            label: 'Force Proxy Refresh',
            // TODO resample the proxy too, maybe?
            click: () => this.proxy.closeAllSockets(),
        };
    }

    *buildProfilesMenu(): Iterable<MenuItemConstructorOptions> {
        for (const profile of this.profiles) {
            yield {
                label: profile.name,
                click: () => {
                    ipcRenderer.send('profile.activate', profile.id);
                },
            };
        }
        yield { type: 'separator' };
        yield {
            label: 'New profile...',
            click: () => {
                ipcRenderer.send('profile.create');
                // Nobody will notice this piece of duct tape, right?
                setTimeout(() => this.refreshProfiles(), 1000);
            },
        };
    }
}
