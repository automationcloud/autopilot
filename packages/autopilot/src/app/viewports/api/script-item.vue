<template>
    <div class="script-item flexrow"
        :class="{
            'script-item--active': isActive,
        }"
        tabindex="0"
        data-selection-id="script.id"
        @uicollapse="viewport.goToServices()"
        @uiactivate="loadScript"
        @contextmenu.prevent="popupMenu">
        <div class="script-item__version">
            {{ script.fullVersion }}
        </div>
        <div class="script-item__workerTag">
            <span class="badge badge--small badge--blue--outline badge--inline">
                {{ script.workerTag }}
            </span>
        </div>
        <div class="script-item__info">
            <div class="script-item__author">
                {{ script.userName }}
            </div>
            <div class="script-item__note">{{ script.note }}</div>
        </div>
        <div class="flexrow__sizer"></div>
        <div class="script-item__controls group group--gap--small">
            <button
                class="button button--small"
                v-if="!isActive"
                @click="controller.publish(script)"
                :disabled="controller.loading">
                Make Active
            </button>
            <button
                class="button  button--small"
                v-if="isActive"
                disabled>
                Active
            </button>
            <span class="group group--merged group--merged--border">
                <button
                    class="button button--small"
                    :class="{
                        'button--primary': isActive,
                    }"
                    @click="controller.loadScript(script)"
                    :disabled="controller.loading">
                    <i class="button__icon fas fa-cloud-download-alt"></i>
                    <span>Load</span>
                </button>
                <button
                    class="button button--small button--icon"
                    :class="{
                        'button--primary': isActive,
                    }"
                    @click="controller.loadAsDiffBase(script)"
                    title="Load as diff base"
                    :disabled="controller.loading">
                    <span>+/-</span>
                </button>
            </span>
        </div>
    </div>
</template>

<script>
import { menu } from '../../util';

export default {

    components: {

    },

    props: {
        script: { type: Object, required: true },
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.scripts; },
        isActive() {
            return this.script.id === this.viewport.selectedService.scriptId;
        },

    },

    methods: {

        loadScript() {
            this.controller.loadScript(this.script);
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Load script',
                    click: () => this.controller.loadScript(this.script),
                },
                {
                    label: 'Load script as diff base',
                    click: () => this.controller.loadAsDiffBase(this.script),
                },
                {
                    label: 'Make script active',
                    click: () => this.controller.publishScript(this.script),
                    enabled: !this.isActive,
                }
            ]);
        },

    }

};
</script>

<style>
.script-item__version {
    flex: 0 0 15%;
}

.script-item__workerTag {
    flex: 0 0 15%;
}

.script-item__info {
}

.script-item__author {
    font-size: 10px;
    font-weight: 500;
}

.script-item__note {
    margin: 2px 0;
    font-size: 10px;
    color: var(--color-cool--500);
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
