<template>
    <div v-if="initialized">
        <first-run v-if="isFirstRun" />
        <div class="root"
            v-else
            @mousedown="onMouseDown">
            <div class="root__scroll-overlay"
                v-if="scrolling"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp">
            </div>
            <modals/>
            <topbar/>
            <disconnected/>
            <layout/>
            <playback/>
            <inspecting/>
        </div>
    </div>
</template>

<script>
import { dom } from '../util';
import '../../../stylesheets/index.css';
import Topbar from './topbar.vue';
import Layout from './layout.vue';
import Modals from './modals.vue';
import Playback from './playback.vue';
import Disconnected from './disconnected.vue';
import Inspecting from './inspecting.vue';
import FirstRun from './first-run.vue';
import { booleanConfig } from '@automationcloud/engine';

const IS_FIRST_RUN = booleanConfig('IS_FIRST_RUN', true);

export default {

    components: {
        Topbar,
        Layout,
        Modals,
        Playback,
        Disconnected,
        Inspecting,
        FirstRun,
    },

    data() {
        return {
            scrolling: false,
            isFirstRun: this.app.config.get(IS_FIRST_RUN),
        };
    },

    computed: {

        initialized() {
            return this.app.initialized;
        },

    },

    methods: {

        onMouseDown(ev) {
            if ((ev.altKey && ev.buttons === 1) || ev.buttons === 4) {
                ev.preventDefault();
                ev.stopPropagation();
                this.scrolling = true;
                this.hScrollEl = dom.getHorizontalScrollParent(ev.target);
                this.vScrollEl = dom.getVerticalScrollParent(ev.target);
            }
        },

        onMouseMove(ev) {
            if (!this.scrolling) {
                return;
            }
            if (this.hScrollEl) {
                this.hScrollEl.scrollLeft -= ev.movementX;
            }
            if (this.vScrollEl) {
                this.vScrollEl.scrollTop -= ev.movementY;
            }
        },

        onMouseUp() {
            this.scrolling = false;
            this.hScrollEl = null;
            this.vScrollEl = null;
        },

    }

};
</script>

<style>
.root {
    position: relative;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-flow: column nowrap;
    align-items: stretch;
}

.root__scroll-overlay {
    position: fixed;
    z-index: 999999;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    cursor: grab;
}
</style>
