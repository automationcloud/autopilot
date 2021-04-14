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
            <proxy-select class="topbar__link"/>
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
import os from 'os';

import { popupMenu } from '../util/menu';
import AccountMenu from './account-menu.vue';
import ProfileIcon from './profile-icon.vue';
import ProxySelect from './proxy-select.vue';
import TitlebarControls from './titlebar-controls.vue';
import Workspaces from './workspaces.vue';

export default {

    inject: [
        'tools',
        'appMenu',
        'clipboardLoader',
    ],

    data() {
        return {
            fullscreen: false,
        };
    },

    components: {
        Workspaces,
        TitlebarControls,
        ProfileIcon,
        ProxySelect,
        AccountMenu,
    },

    computed: {

        osPlatform() {
            return os.platform();
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

        popupMisc() {
            const mem = process.memoryUsage();
            popupMenu([
                ...this.appMenu.buildMenuItems(),
                { type: 'separator' },
                {
                    label: 'Clipboard',
                    submenu: [...this.clipboardLoader.buildMenu()]
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
                    label: 'Preferences',
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
                                    viewportId: 'browser'
                                },
                            ]
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: `Autopilot ${this.tools.version}`,
                    enabled: false,
                },
                {
                    label: `Memory: ${Math.round(mem.rss / 1024 / 1024)}MiB`,
                    enabled: false,
                },
            ]);
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
    --topbar-height: 38px;
    flex: 0 0 auto;
    display: flex;
    flex-flow: row nowrap;
    min-height: var(--topbar-height);

    background: var(--color-mono--800);
    color: var(--ui-color--white);

    -webkit-app-region: drag;
    user-select: none;
}

/* In Full Screen, traffic lights are not visible; otherwise we offset the logo to right to fit them */
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
    height: var(--topbar-height);
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

    font-family: var(--font-family--alt);
    font-weight: 400;
}
</style>
