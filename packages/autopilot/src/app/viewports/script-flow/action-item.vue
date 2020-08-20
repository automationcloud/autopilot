<template>
    <div class="action-item"
        :class="[
            'action-item--' + action.type,
            'action-item--' + diffStatus,
            {
                'action-item--selected': isSelected,
                'action-item--search-result': isSearchResult,
            },
        ]">

        <div class="bar"
            :data-selected="isSelected"
            :data-selection-id="action.id"
            :data-dnd-path="action.$path"
            tabindex="0"
            ref="bar"
            @click.prevent="onBarClick"
            @dblclick="toggleExpand"
            @uiexpand="expand"
            @uicollapse="collapse"
            @uiselect="onUiSelect"
            @uiselecttoggle="onUiSelectToggle"
            @uiselectexpand="onUiSelectExpand"
            @uiactivate="onUiActivate"
            @contextmenu.prevent.stop="onUiActivate"
            draggable="true"
            v-on="dnd.createDragListeners()">

            <expand class="expand"
                :id="action.id"
                v-if="hasChildren"/>

            <i class="action-icon"
                :class="icon">
            </i>

            <div class="summary">
                <span class="type">
                    {{ metadata.method }}
                </span>
                <sup class="optional"
                      v-if="action.optional">
                    opt
                </sup>
                <span class="label"
                    :class="{
                        'label--dynamic': !action.isLabelEditable()
                    }">
                    {{ label }}
                </span>

                <div class="group group--gap--small">
                    <span class="badge badge--cool badge--inline badge--small"
                        v-if="action.$iteration != null"
                        title="Current loop iteration">
                      {{ action.$iteration }}
                    </span>
                </div>
            </div>

            <div class="runtime">
                <span class="badge badge--inline badge--small"
                    :class="{
                        'badge--yellow--outline': action.delay < 500,
                        'badge--red--outline': action.delay >= 500
                    }"
                    v-if="delay">
                    {{ delay }}
                </span>

                <div class="duration"
                    v-if="isFinished">
                    {{ duration }}
                </div>

                <div class="help-icon"
                    v-if="isSelected">
                    <span
                        class="far fa-question-circle"
                        @click.stop="onHelpClick">
                    </span>
                </div>
                <div class="indicator"
                    :class="[
                        'indicator--' + (hasBreakpoint ? 'breakpoint' : status),
                        {
                            'indicator--bypassed': isBypassed,
                        },
                    ]">
                </div>
            </div>
        </div>

        <div class="body"
            v-if="isExpanded && hasChildren">

            <action-list
                :list="action.children"/>

        </div>

    </div>
</template>

<script>
import { ScriptDiffController } from '~/controllers';

export default {

    props: {
        action: { type: Object, required: true }
    },

    beforeCreate() {
        // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
        this.$options.components.ActionList = require('./action-list.vue').default;
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptFlow;
        },

        diff() {
            return this.get(ScriptDiffController);
        },

        script() {
            return this.app.project.script;
        },

        isExpanded() {
            return this.app.ui.expandable.isExpanded(this.action.id);
        },

        isSelected() {
            return this.viewport.isSelected(this.action);
        },

        isSearchResult() {
            return this.viewport.search.isResultHighlighted(this.action);
        },

        diffStatus() {
            return this.diff.getObjectStatus(this.action);
        },

        hasChildren() {
            return this.action.hasChildren();
        },

        icon() {
            return this.app.ui.objects.getActionIcon(this.action.type);
        },

        isFinished() {
            return this.action.isFinished();
        },

        status() {
            return this.action.getStatus();
        },

        duration() {
            return this.ms(this.action.getDuration());
        },

        delay() {
            return this.action.delay ? this.ms(this.action.delay) : 0;
        },

        isBypassed() {
            return this.action.$runtime.bypassed;
        },

        hasBreakpoint() {
            return this.app.playback.breakpointIds.includes(this.action.id);
        },

        dnd() {
            return this.viewport.dndActions;
        },

        metadata() {
            return this.action.$class.$metadata;
        },

        label() {
            return this.action.getLabel();
        },

    },

    methods: {

        ms(delay) {
            if (delay < 1000) {
                return delay + 'ms';
            }
            delay = ((delay || 0) / 1000).toFixed(1);
            return delay + 's';
        },

        expand() {
            this.app.ui.expandable.expand(this.action.id);
        },

        collapse() {
            this.app.ui.expandable.collapse(this.action.id);
        },

        toggleExpand() {
            this.app.ui.expandable.toggleExpand(this.action.id);
        },

        onBarClick(ev) {
            this.app.ui.navigation.handleViewportNavigationClick(this.$refs.bar, ev);
        },

        onUiSelect() {
            this.viewport.selectItem(this.action);
        },

        onUiSelectToggle() {
            this.viewport.toggleSelectItem(this.action);
        },

        onUiSelectExpand() {
            this.viewport.expandSelectionTo(this.action);
        },

        onUiActivate() {
            if (!this.viewport.isSelected(this.action)) {
                this.viewport.selectItem(this.action);
            }
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showActionItemMenu();
            }, 1);
        },

        onHelpClick() {
            this.viewport.showActionHelpModal(this.action.type);
        }

    }

};
</script>

<style scoped>
.action-item {
    position: relative;
}

.bar {
    position: relative;
    display: flex;
    align-items: center;
    height: var(--tree-bar-size);
}

.bar::before {
    content: '';
    position: absolute;
    z-index: 2;
    left: -1px;
    top: 0;
    bottom: 0;
    width: 3px;
}

.action-item--added > .bar::before {
    background: var(--color-green--500);
}

.action-item--modified > .bar::before {
    background: var(--color-yellow--500);
}

.bar:hover::after {
    content: '';
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,.04);
    pointer-events: none;
}

.action-item--selected > .bar {
    background: var(--ui-selected-background-color);
}

.action-item--search-result > .bar {
    background: var(--color-yellow--300);
}

.action-item--search-result.action-item--selected > .bar {
    background: var(--color-yellow--400);
}

.bar:focus {
    outline: 0;
    z-index: 2;
    border-color: var(--border-color--focus);
    box-shadow: 0 0 0 2px var(--border-shadow--focus) inset,
        0 0 0 1px var(--border-color--focus);
}

.expand, .action-icon {
    width: var(--tree-icon-size);
    text-align: center;
}

.expand + .action-icon {
    margin-left: -8px;
}

.summary {
    flex: 1;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.label {
    max-width: 80%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 2px 0 var(--gap--small);
}

.label--dynamic {
    padding: 2px 4px;
    color: #fff;
    background: var(--color-blue--500);
    border-radius: 2px;
}

.delay--slow {
    color: var(--color-red--500);
}

.optional {
    margin: 0 0 0 3px;
    color: var(--color-cool--500);
    align-self: flex-start;
    font-size: 75%;
    line-height: 1;
}

.type {
    opacity: .7;
}

.body {
    border-left: 1px solid var(--color-warm--300);
    margin-left: calc(.5 * var(--tree-icon-size));
}

.runtime {
    display: flex;
    align-items: center;
    padding: 0 var(--gap--small);
}

.duration {
    opacity: 0.5;
    margin-left: var(--gap--small);
}

.indicator {
    margin-left: var(--gap--small);
    width: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
}

.indicator::after {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 100%;
    border: 1px solid var(--color-warm--500);
    background: var(--color-warm--500);
}

.indicator--idle::after {
    width: 4px;
    height: 4px;
}

.indicator--running::after {
    border-color: var(--color-yellow--500);
    background: var(--color-yellow--500);
    transform-origin: 50% 50%;
    animation: pop 1s infinite alternate ease-in-out;
}

.indicator--success::after {
    border-color: var(--color-green--500);
    background: var(--color-green--500);
}

.indicator--breakpoint::after {
    border-radius: 0%;
    border-color: var(--color-red--500);
    background: var(--color-red--500);
}

.indicator--fail::after {
    border-color: var(--color-red--500);
    background: var(--color-red--500);
}

.indicator--bypassed::after {
    background: transparent;
}

.help-icon {
    font-size: .9em;
    color: var(--border-color--focus);
    margin-left: var(--gap--small);
}

.help-icon:hover {
    cursor: pointer;
}

@keyframes pop {
    0% {
        transform: scale(1);
    }
    100% {
        transform: scale(0.5);
    }
}
</style>

<style>
/* TODO fix it! */
.bar.dnd--over {
    box-shadow: 0 4px 0 0 var(--border-color--focus);
}
</style>
