<template>
    <div class="titlebar-controls">
        <div class="titlebar-controls__button titlebar-controls__button--minimize"
            title="Mininize"
            @click="minimize">
            <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0" y="8" width="10" height="1"></rect>
            </svg>
        </div>
        <div class="titlebar-controls__button titlebar-controls__button--maximize"
            title="Maximize"
            @click="maximize">
            <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M 0 0 L 0 10 L 10 10 L 10 0 L 0 0 z M 1 1 L 9 1 L 9 9 L 1 9 L 1 1 z "/>
            </svg>
        </div>
        <div class="titlebar-controls__button titlebar-controls__button--close"
            title="Close"
            @click="close">
            <svg width="9" height="9" viewBox="0 0 10 10">
                <polygon points="10,1 9,0 5,4 1,0 0,1 4,5 0,9 1,10 5,6 9,10 10,9 6,5"></polygon>
            </svg>
        </div>
    </div>
</template>

<script>
import { remote } from 'electron';

export default {

    data() {
        return {
            maximized: false,
        };
    },

    mounted() {
        this.refreshState();
    },

    methods: {

        minimize() {
            const wnd = remote.getCurrentWindow();
            wnd.minimize();
        },

        maximize() {
            const wnd = remote.getCurrentWindow();
            if (wnd.isMaximized()) {
                wnd.unmaximize();
                this.maximized = false;
            } else {
                wnd.maximize();
                this.maximized = true;
            }
        },

        close() {
            const wnd = remote.getCurrentWindow();
            wnd.close();
        },

        refreshState() {
            const wnd = remote.getCurrentWindow();
            this.maximized = wnd.isMaximized();
        },

    }

};
</script>

<style>
.titlebar-controls {
    display: flex;
    padding: 0 var(--gap--small);
    align-self: center;
    align-items: center;
    border-left: 1px solid rgba(255,255,255,.25);
}

.titlebar-controls__button {
    padding: var(--gap--small) 0;
    width: 24px;
    text-align: center;
    -webkit-app-region: no-drag;
}

.titlebar-controls__button svg {
    shape-rendering: crispEdges;
    fill: rgba(255,255,255,.25);
    transition: fill .2s;
}

.titlebar-controls__button:hover svg {
    fill: rgba(255,255,255,.85);
}

.titlebar-controls__button--close:hover svg {
    fill: rgba(232, 17, 35, 0.9);
}
</style>
