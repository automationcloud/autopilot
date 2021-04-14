<template>
    <div class="log-item"
        :class="'log-item--' + itemType">
        <div class="log-item__time">
            +{{ relativeTime }}
        </div>
        <div class="log-item__icon">
            <i :class="iconClass">
            </i>
        </div>
        <div class="log-item__body">
            <div class="log-item__title">
                <div class="log-item__event-name">
                    <span v-if="itemType === 'context-enter'">Context Enter</span>
                    <span v-if="itemType === 'context-leave'">Context Leave</span>
                    <span v-if="itemType === 'action-start'">Action Start</span>
                    <span v-if="itemType === 'action-end'">Action End</span>
                    <span v-if="itemType === 'fail'">Error</span>
                    <span v-if="itemType === 'success'">Success</span>
                    <span v-if="itemType === 'input'">Input</span>
                    <span v-if="itemType === 'output'">Output</span>
                </div>
                <div class="log-item__subtitle"
                    v-if="item.action">
                    {{ item.action.type }}
                </div>
            </div>
            <div class="log-item__details">
                <a v-if="item.action"
                    @click="goTo(item.action)">
                    {{ item.action.label }}
                </a>
                <a v-if="item.context"
                    @click="goTo(item.context)">
                    {{ item.context.name }}
                </a>
                <template v-if="item.error">
                    <span class="log-item__error-code"
                        v-if="item.error.code">
                        {{ item.error.code }}
                    </span>
                    <span class="log-item__error-message">
                        {{ item.error.message }}
                    </span>
                </template>
                <span class="badge badge--inline badge--blue--outline badge--small"
                    v-if="item.type === 'input'">
                    {{ key }}
                </span>
                <span class="badge badge--inline badge--blue badge--small"
                    v-if="item.type === 'output'">
                    {{ key }}
                </span>
                <!--
                <div class="log-item__inspect"
                    v-if="dataObject">
                    <explore :data="dataObject"/>
                </div>
                -->
            </div>
            <div class="log-item__action-separator"
                v-if="itemType === 'action-start'">
            </div>
        </div>
        <div class="log-item__context-separator"
            v-if="itemType === 'context-enter'">
        </div>
    </div>
</template>

<script>
import moment from 'moment';

export default {

    inject: [
        'editor',
    ],

    props: {
        item: { type: Object, required: true },
        isFirst: { type: Boolean, required: true },
        isLast: { type: Boolean, required: true },
        timestampOrigin: { type: Number, required: true }
    },

    computed: {

        relativeTime() {
            const { timestampOrigin, item: { timestamp } } = this;
            return moment.utc(timestamp - timestampOrigin).format('mm:ss.SSS');
        },

        itemType() {
            return this.item.type.replace(/\./ig, '-');
        },

        iconClass() {
            switch (this.itemType) {
                case 'context-enter':
                case 'context-leave':
                    return 'fas fa-map-marker-alt';
                case 'action-start':
                case 'action-end':
                    return this.editor.getActionIcon(this.item.action.type);
                case 'fail':
                    return 'fas fa-exclamation-circle';
                case 'input':
                    return 'fas fa-sign-in-alt';
                case 'output':
                    return 'fas fa-sign-out-alt';
                case 'success':
                    return 'fas fa-check-circle';
                default:
                case 'playback':
                    switch (this.item.playbackEvent) {
                        case 'pause':
                            return 'fas fa-pause';
                        case 'playScript':
                        case 'playContext':
                        case 'playAction':
                        default:
                            return 'fas fa-play';
                    }
            }
        },

        key() {
            const { input, output } = this.item;
            const { key, stage } = input || output || {};
            return [key, stage].filter(Boolean).join('@');
        },

        dataObject() {
            const { output } = this.item;
            if (!output) {
                return null;
            }
            return { data: output.data };
        }

    },

    methods: {

        goTo(node) {
            this.app.viewports.scriptFlow.activateViewport();
            this.app.viewports.scriptFlow.selectItem(node);
            this.app.viewports.scriptFlow.revealSelected();
        },

    }

};
</script>

<style>
.log-item {
    --log-icon-size: 24px;
    --log-gap: 20px;
    --log-time-width: 64px;
    position: relative;
    display: flex;
    align-items: center;
    padding-bottom: var(--log-gap);
    min-height: calc(var(--log-icon-size) + var(--log-gap));
}

.log-item::after {
    content: '';
    position: absolute;
    z-index: 0;
    top: 0;
    bottom: 0;
    left: calc(var(--log-time-width) + var(--log-icon-size) / 2);
    margin-left: -1px;
    border-left: 2px solid var(--color-mono--300);
}

.log-item--context-enter {
    --log-gap: 32px;
}
.log-item--action-start {
    --log-gap: 28px;
}

.log-item__time {
    flex: 0 0 var(--log-time-width);
    font-size: var(--font-size--small);
}

.log-item__icon {
    position: relative;
    z-index: 1;
    width: var(--log-icon-size);
    height: var(--log-icon-size);
    flex: 0 0 var(--log-icon-size);
    border-radius: 100%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-mono--300);
}

.log-item--context-enter .log-item__icon,
.log-item--context-leave .log-item__icon {
    border-color: var(--color-yellow--500);
    color: var(--color-yellow--500);
}

.log-item--action-start .log-item__icon,
.log-item--action-end .log-item__icon {
    background: var(--color-mono--100);
    border-color: var(--color-mono--500);
    color: var(--color-mono--500);
}

.log-item--playback .log-item__icon {
    border-color: var(--color-mono--700);
    background: var(--color-mono--700);
    color: #fff;
}

.log-item--input .log-item__icon {
    background: var(--color-blue--100);
    border-color: var(--color-6lue--500);
    color: var(--color-blue--600);
}

.log-item--output .log-item__icon {
    border-color: var(--color-blue--600);
    background: var(--color-blue--600);
    color: var(--color-blue--100);
}

.log-item--fail .log-item__icon {
    border-color: var(--color-red--500);
    background: var(--color-red--500);
    color: #fff;
}

.log-item--success .log-item__icon {
    border-color: var(--color-green--600);
    background: var(--color-green--600);
    color: #fff;
}

.log-item__body {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    margin-left: var(--gap);
}

.log-item__title {
    flex: 0 0 100px;
    white-space: nowrap;
    overflow: hidden;
}

.log-item__event-name {
    font-weight: 600;
}

.log-item__inspect {
    margin: var(--gap--small) 0;
}

.log-item--fail .log-item__event-name {
    color: var(--color-red--500);
}

.log-item__subtitle {
    padding-top: var(--gap--small);
}

.log-item__details {
    flex: 1;
    align-self: flex-start;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.log-item__error-code {
    background: var(--color-red--500);
    color: #fff;
    border-radius: var(--control-border-radius);
    padding: 2px 4px;
    display: inline-block;
}

.log-item__error-message {
    color: var(--color-red--500);
}

.log-item__context-separator {
    position: absolute;
    bottom: calc(var(--log-gap) / 2);
    left: 0;
    right: 0;
    border-bottom: 1px dashed var(--color-mono--300);
}

.log-item__action-separator {
    position: absolute;
    bottom: -12px;
    left: 0;
    right: 0;
    border-bottom: 1px dashed var(--color-mono--300);
}
</style>
