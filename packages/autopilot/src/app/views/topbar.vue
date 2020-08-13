<template>
    <div class="topbar"
        :class="[
            'topbar--' + osPlatform,
            {
                'topbar--fullscreen': fullscreen,
            }
        ]">

        <img src="resources/ubio-robot-white.svg"
            class="topbar__logo"/>

        <workspaces class="topbar__workspaces"/>

        <div class="topbar__tools">
            <div class="topbar__link"
                :title="sampleSuccess ? 'Roxi settings' : 'Roxi settings: No proxy for the selected tags'"
                v-if="roxiBarShown">
                <div class="group group--merged">
                    <button class="button button--small button--flat"
                        :class="{ 'button--primary': roxiEnabled }"
                        @click="popupRoxi">
                        <i class="button__icon fas fa-exchange-alt"></i>
                        <span v-if="sampleSuccess">{{ roxiTags.length > 1 ? roxiTags[0] + '...' : roxiTags[0] }}</span>
                        <span v-if="!sampleSuccess">No proxy</span>
                    </button>
                </div>
            </div>

            <profile-icon class="topbar__link"/>
            <account-menu class="topbar__link"/>
            <div class="topbar__link"
                title="Menu"
                @click="popupMisc">
                <i class="fas fa-ellipsis-v"></i>
            </div>
        </div>

        <titlebar-controls v-if="osPlatform !== 'darwin'"/>

    </div>
</template>

<script>
import { remote } from 'electron';
import Workspaces from './workspaces.vue';
import ProfileIcon from './profile-icon.vue';
import AccountMenu from './account-menu.vue';
import TitlebarControls from './titlebar-controls.vue';
import { popupMenu } from '../util/menu';
import os from 'os';
import pkg from '../../../package.json';
import { ApiLoginController, RoxiController, AppMenuController } from '~/controllers';

export default {

    data() {
        return {
            fullscreen: false,
        };
    },

    components: {
        Workspaces,
        TitlebarControls,
        ProfileIcon,
        AccountMenu,
    },

    computed: {

        osPlatform() {
            return os.platform();
        },

        roxi() {
            return this.get(RoxiController);
        },

        appMenu() {
            return this.get(AppMenuController);
        },

        apiLogin() {
            return this.get(ApiLoginController);
        },

        roxiEnabled() {
            return this.roxi.isEnabled();
        },

        roxiCache() {
            return this.roxi.isUseCache();
        },

        roxiTags() {
            return this.roxi.getSelectedTags();
        },

        roxiBarShown() {
            return this.roxi.isSecretConfigured() && this.apiLogin.authorised;
        },

        env() {
            return this.app.settings.env;
        },

        sampleSuccess() {
            return this.roxi.isSampleProxyFound();
        },

        clipboardLoader() {
            return this.app.ui.clipboardLoader;
        },
    },

    mounted() {
        this.refreshWindowState();
        window.addEventListener('resize', this.refreshWindowState);
    },

    destroyed() {
        window.removeEventListener('resize', this.refreshWindowState);
    },

    methods: {

        popupRoxi() {
            const menuItems = [
                {
                    label: 'Enabled',
                    type: 'checkbox',
                    checked: this.roxiEnabled,
                    click: () => {
                        this.roxi.setEnabled(!this.roxiEnabled);
                    }
                },
                { type: 'separator' }
            ];
            for (const tag of this.roxi.tags) {
                menuItems.push({
                    label: tag,
                    type: 'checkbox',
                    checked: this.roxiTags.includes(tag),
                    click: () => {
                        this.roxi.toggleTag(tag);
                    }
                });
            }
            popupMenu(menuItems);
        },

        popupMisc() {
            const mem = process.memoryUsage();
            popupMenu([
                ...this.appMenu.buildMenuItems(),
                { type: 'separator' },
                {
                    label: 'Clipboard',
                    submenu:  [...this.clipboardLoader.buildMenu()]
                },
                {
                    label: 'Recipes',
                    click: () => {
                        this.app.layout.activateInternalWorkspace({
                            type: 'viewport',
                            viewportId: 'recipes'
                        });
                    }
                },
                {
                    label: 'Settings',
                    click: () => {
                        this.app.layout.activateInternalWorkspace({
                            type: 'column',
                            children: [
                                {
                                    type: 'viewport',
                                    viewportId: 'settings'
                                },
                                {
                                    type: 'viewport',
                                    viewportId: 'chrome-connection'
                                },
                            ]
                        });
                    }
                },
                this.switchEnvMenuItem(),
                { type: 'separator' },
                {
                    label: `Autopilot ${pkg.version}`,
                    enabled: false,
                },
                {
                    label: `Memory: ${Math.round(mem.rss / 1024 / 1024)}MiB`,
                    enabled: false,
                },
            ]);
        },

        switchEnvMenuItem() {
            const newEnv = this.env === 'production' ? 'staging' : 'production';

            return {
                label: 'Switch to ' + newEnv,
                click: () => this.app.settings.setEnv(newEnv),
            };
        },

        refreshWindowState() {
            const wnd = remote.BrowserWindow.getFocusedWindow();
            if (wnd) {
                this.fullscreen = wnd.isFullScreen();
            }
        },

    }

};
</script>

<style>
.topbar {
    --link-vertical-gap: 10px;
    flex: 0 0 auto;
    display: flex;
    flex-flow: row nowrap;

    background: var(--color-mono--800);
    color: var(--ui-color--white);

    -webkit-app-region: drag;
    user-select: none;
}

.topbar--darwin:not(.topbar--fullscreen) .topbar__logo {
    margin-left: 72px;
}

.topbar__logo {
    padding: 0 var(--gap);
    user-select: none;
    -webkit-user-drag: none;
}

.topbar__tools {
    flex: 0 0 auto;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-end;
    margin: 0 var(--gap--small);
    -webkit-app-region: no-drag;
}

.topbar__link {
    flex: 0 0 auto;
    min-width: 24px;
    padding: 10px var(--gap--small);
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    cursor: pointer;
}

@media (max-width: 480px) {
    .topbar {
        flex-flow: row wrap;
    }

    .topbar__tools {
        flex: 1;
    }

    .topbar__workspaces {
        order: 3;
        flex: 0 0 100%;
    }
}
</style>
