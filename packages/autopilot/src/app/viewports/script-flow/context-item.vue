<template>
    <div class="context-item"
        :class="[
            'context-item--' + diffStatus,
            {
                'context-item--selected': isSelected,
                'context-item--expanded': isExpanded,
                'context-item--search-result': isSearchResult,
            }
        ]">

        <div class="bar"
            :data-selected="isSelected"
            :data-selection-id="context.id"
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
            @contextmenu.prevent.stop="onUiActivate">

            <expand
                :stop-propagation="true"
                :id="context.id"
                class="expand"/>

            <i class="icon fas fa-map-marker-alt"
                :class="{
                    'icon--failure': context.flowType === 'fail',
                    'icon--success': context.flowType === 'success',
                }">
            </i>

            <div class="summary">
                <div class="title">
                    <span class="name">
                        {{ context.name }}
                    </span>
                </div>
                <div class="error-code"
                    v-if="context.errorCode">
                    {{ context.errorCode }}
                </div>
            </div>

            <div v-if="context.type === 'context'"
                class="aside group group--gap--small">
                <span
                    class="badge badge--small badge--inline"
                    :class="{
                        'badge--yellow--outline': !isSlow,
                        'badge--red--outline': isSlow
                    }"
                    v-if="showSlowBadge">
                    <i class="color--red far fa-clock"
                        v-if="context.matchMode === 'slow'"
                        title="Slow matching mode">
                    </i>
                    <span v-if="actionStats.delay > 0">
                        {{ ms(actionStats.delay) }}
                    </span>
                </span>
                <span class="badge badge--small"
                    v-if="isMatches">
                  match
                </span>
                <span class="visits badge badge--small"
                      :class="{
                          'badge--outline': !context.$visited,
                          'badge--mono': context.$visited > 0,
                          'badge--mono': context.$visited >= context.limit,
                      }">
                    {{ context.$runtime.visited }} / {{ context.limit }}
                </span>
            </div>

        </div>

        <div class="body"
            v-if="isExpanded">

            <div v-if="context.type === 'context'"
                class="list list--matchers"
                :class="{ 'list--empty': !context.matchers.length }">
                <div class="list-body">
                    <div class="heading"
                        :class="{
                            'heading--warning': showMatcherWarning
                        }">
                        Matchers ({{ context.matchers.length }})
                    </div>
                    <div v-if="showMatcherWarning"
                        class="matcher-warning">
                        No matchers defined
                    </div>
                    <action-list :list="context.matchers"/>
                </div>
            </div>

            <div class="list list--actions"
                :class="{ 'list--empty': !context.children.length }">
                <div class="list-body">
                    <div class="heading">
                        Actions ({{ context.children.length }})
                    </div>
                    <action-list :list="context.children"/>
                </div>
            </div>

            <div class="list list--definitions"
                :class="{ 'list--empty': !context.definitions.length }">
                <div class="list-body">
                    <div class="heading">
                        Definitions ({{ context.definitions.length }})
                    </div>
                    <action-list :list="context.definitions"/>
                </div>
            </div>

        </div>

        <insert-line
            v-if="showInsertLines"
            class="insert insert-line--hover"
            @click="showCreateMenu"
            @contextmenu.prevent.stop="showCreateMenu"/>

    </div>
</template>

<script>
import ActionList from './action-list.vue';
import { ScriptDiffController, ExpandableController } from '~/controllers';

export default {

    components: {
        ActionList
    },

    props: {
        context: { type: Object, required: true }
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

        expandable() {
            return this.get(ExpandableController);
        },

        isExpanded() {
            return this.expandable.isExpanded(this.context.id);
        },

        isSelected() {
            return this.viewport.isSelected(this.context);
        },

        isSearchResult() {
            return this.viewport.search.isResultHighlighted(this.context);
        },

        diffStatus() {
            return this.diff.getObjectStatus(this.context);
        },

        duration() {
            return this.ms(this.context.getDuration());
        },

        isFinished() {
            return this.context.isFinished();
        },

        actionStats() {
            const stats = {
                delay: 0
            };
            for (const action of this.context.descendentActions()) {
                switch (action.type) {
                    case 'sleep':
                        stats.delay += action.delay;
                        break;
                }
            }
            return stats;
        },

        showSlowBadge() {
            return this.actionStats.delay > 0 || this.context.matchMode === 'slow';
        },

        isSlow() {
            return this.actionStats.delay >= 500 || this.context.matchMode === 'slow';
        },

        isMatches() {
            const { context } = this;
            const matchers = context.matchers;
            return matchers.length &&
                matchers.items.every(m => m.isFinished() && !m.$runtime.error);
        },

        showInsertLines() {
            return this.viewport.isShowInsertLines();
        },

        showMatcherWarning() {
            const { context } = this;
            return context.type === 'context' && context.matchers.length < 1;
        }

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
            this.expandable.expand(this.context.id);
        },

        collapse() {
            this.expandable.collapse(this.context.id);
        },

        toggleExpand() {
            this.expandable.toggleExpand(this.context.id);
        },

        onBarClick(ev) {
            this.app.ui.navigation.handleViewportNavigationClick(this.$refs.bar, ev);
        },

        onUiSelect() {
            this.viewport.selectItem(this.context);
        },

        onUiSelectToggle() {
            this.viewport.toggleSelectItem(this.context);
        },

        onUiSelectExpand() {
            this.viewport.expandSelectionTo(this.context);
        },

        onUiActivate() {
            if (!this.viewport.isSelected(this.context)) {
                this.viewport.selectItem(this.context);
            }
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showContextItemMenu();
            }, 1);
        },

        showCreateMenu() {
            this.viewport.selectItem(this.context);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreateMenu();
            }, 1);
        }

    }

};
</script>

<style scoped>
.context-item {
    position: relative;
    user-select: none;
}

/* diff marker */
.context-item::before {
    content: '';
    position: absolute;
    z-index: 2;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
}

.bar {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    align-items: baseline;
    padding: var(--gap) 0;
    background: var(--color-warm--100);
    box-shadow: 0 0 0 1px var(--color-warm--400);
}

.context-item--added::before {
    background: var(--color-green--500);
}

.context-item--modified::before {
    background: var(--color-yellow--500);
}

.context-item--selected .bar {
    z-index: 1;
    background: var(--ui-selected-background-color);
    box-shadow: 0 0 0 1px var(--ui-selected-border-color);
}

.context-item--search-result .bar {
    background: var(--color-yellow--300);
}

.context-item--search-result.context-item--selected .bar {
    background: var(--color-yellow--400);
}

.bar:focus {
    outline: 0;
    z-index: 2;
    box-shadow: 0 0 0 2px var(--border-shadow--focus) inset,
        0 0 0 1px var(--border-color--focus);
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

.expand {
    width: var(--tree-icon-size);
}

.icon {
    width: 16px;
}

.icon--failure {
    color: var(--color-red--500);
}

.icon--success {
    color: var(--color-green--500);
}

.summary {
    flex: 1;
    min-width: 0;
    line-height: 1.2em;
}

.title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.name {
    font-weight: 600;
}

.aside {
    padding: 0 var(--gap--small);
}

.error-code {
    margin-top: var(--gap--small);
    font-size: 10px;
    color: var(--color-red--500);
}

.list-body {
    border-left: 1px solid var(--color-warm--300);
    margin-left: calc(.5 * var(--tree-icon-size));
}

.list--matchers, .list--definitions {
    background: var(--color-cool--100);
}

.list--empty >>> .insert-line {
    height: 16px;
}

.heading {
    padding: var(--gap) var(--gap--small) 0;
    font-size: var(--font-size--small);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-cool--500);
}

.heading--warning {
    color: var(--color-yellow--600);
}

.insert {
    height: 8px;
    margin: -4px 0;
}

/* Matcher warning item */

.matcher-warning {
    color: var(--color-yellow--600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: var(--gap) var(--gap--small) 0;
    opacity: .75;
}
</style>
