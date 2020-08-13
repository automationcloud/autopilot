<template>
    <div class="pipe-item"
        :class="[
            'pipe-item--' + diffStatus,
            {
                'pipe-item--nested': isNested,
                'pipe-item--selected': isSelected,
                'pipe-item--disabled': !pipe.enabled,
                'pipe-item--error': !!error,
            }
        ]"
        @focusin="focused = true"
        @focusout="focused = false"
        @click.stop="onBarClick">

        <div class="bar"
            :data-selected="isSelected"
            :data-selection-id="pipe.id"
            tabindex="0"
            ref="bar"
            @dblclick="toggleExpand"
            @uiexpand="expand"
            @uicollapse="collapse"
            @uiselect="onUiSelect"
            @uiselecttoggle="onUiSelectToggle"
            @uiselectexpand="onUiSelectExpand"
            @uiactivate="onUiActivate"
            @contextmenu.prevent.stop="onUiActivate">

            <div class="bar-main">

                <expand
                    class="expand"
                    :stop-propagation="true"
                    :id="pipe.id"/>

                <span class="pipe-label">
                    <span class="pipe-ns"
                        v-if="metadata.ns">
                        {{ metadata.ns }}.
                    </span>
                    <span class="pipe-method">
                        {{ metadata.method }}
                    </span>
                </span>
                <span class="hint custom-label"
                    v-if="pipe.label"
                    @click="viewport.showEditNotes = true">
                    {{ pipe.label }}
                </span>
                <span class="hint"
                    v-else
                    v-for="hint in hintParams">
                    {{ hint }}
                </span>
            </div>

            <div class="bar-aside">
                <sampler
                    :key="pipe.id"
                    :pipeline-controller="pipelineController"
                    :pipe="pipe"
                    :output-set="outputSet"
                    :error="error"/>
                <div class="duration"
                    :class="{
                        'duration--slow': isSlow,
                    }">
                    <i class="far fa-clock"></i>
                    <div class="duration-time">
                        {{ duration }}
                    </div>
                </div>
                <input
                    class="enabled"
                    type="checkbox"
                    v-model="pipeProxy.enabled"/>
            </div>

        </div>

        <div
            class="body"
            v-if="isExpanded">

            <pipe-notes :pipe="pipe"/>

            <div
                class="params"
                v-if="params.length">
                <edit-param
                    v-for="param of params"
                    :key="param.name"
                    :param="param"
                    :pipeline-controller="pipelineController"
                    :item="pipe"
                    :item-proxy="pipeProxy"
                    :input-set="inputSet"/>
            </div>

        </div>

        <div class="result"
            v-if="isResultShown">
            <template v-if="outputSet">
                <div class="result-empty"
                    v-if="!outputSet.length">
                    &times; 0 (expected result)
                </div>
                <elem
                    v-if="outputSampleEl"
                    :el="outputSampleEl"/>
            </template>
            <template v-else>
                <err :err="error" v-if="error"/>
                <div class="result-empty" v-else>
                    Result unavailable
                </div>
            </template>
        </div>

        <div class="arrow arrow"
            :class="arrowClass"
            v-if="isArrowShown">
        </div>

    </div>
</template>

<script>
import { ScriptDiffController } from '~/controllers';
import ms from 'ms';
import Elem from './elem.vue';
import Err from './err.vue';
import EditParam from '../params/edit-param.vue';
import Sampler from './sampler.vue';
import PipeNotes from './pipe-notes.vue';

export default {

    components: {
        Elem,
        Err,
        EditParam,
        Sampler,
        PipeNotes,
    },

    props: {
        pipelineController: { type: Object, required: true },
        pipe: { type: Object, required: true },
        index: { type: Number, required: true },
    },

    data() {
        return {
            focused: false,
        };
    },

    computed: {

        diff() {
            return this.get(ScriptDiffController);
        },

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        pipeProxy() {
            return this.viewport.createPipeProxy(this.pipe);
        },

        isExpanded() {
            return this.app.ui.expandable.isExpanded(this.pipe.id);
        },

        isSelected() {
            return this.viewport.isSelected(this.pipe);
        },

        diffStatus() {
            return this.diff.getObjectStatus(this.pipe);
        },

        isNested() {
            return this.depth > 0;
        },

        isLast() {
            return this.pipe.$owner.last === this.pipe;
        },

        metadata() {
            return this.pipe.$class.$metadata;
        },

        hintParams() {
            const stringParams = this.pipe.getParams()
                .filter(_ => _.type === 'string')
                .filter(_ => _.name !== 'label')
                .map(p => this.getParam(p.name));
            return stringParams
                .concat(this.definitionLabel)
                .map(_ => String(_ || '').trim())
                .filter(Boolean);
        },

        params() {
            return this.pipe.getParams();
        },

        // Feedback

        results() {
            return this.pipelineController.getPipeResults(this.pipe.id);
        },

        inputSet() {
            return this.results.inputSet || [];
        },

        outputSet() {
            return this.results.outputSet;
        },

        nextInputSet() {
            return this.results.nextInputSet;
        },

        error() {
            return this.results.error;
        },

        duration() {
            const { duration } = this.results;
            return duration > 1000 ? ms(duration) : duration.toString();
        },

        isSlow() {
            return this.results.duration > 100;
        },

        outputSampleEl() {
            return this.nextInputSet ? this.nextInputSet[0] : null;
        },

        // Misc

        depth() {
            return this.pipe.getDepth();
        },

        isArrowShown() {
            if (this.depth > 0) {
                return !this.isLast;
            }
            return true;
        },

        arrowClass() {
            return this.isResultShown ? 'arrow--alt' :
                this.isSelected ? 'arrow--selected' : '';
        },

        isResultShown() {
            return this.isExpanded &&
                (this.error || this.isVerboseFeedback || this.isSelected);
        },

        isSpotlightEnabled() {
            return this.pipelineController.isPipeSpotlighted(this.pipe.id);
        },

        definitionLabel() {
            const param = this.pipe.getParams().find(_ => _.type === 'definition');
            if (!param) {
                return null;
            }
            const definitionId = this.getParam(param.name);
            try {
                const definition = this.pipe.$script.requireDefinition(definitionId);
                return definition.label;
            } catch (err) {
                return '<definition not found>';
            }
        },

        isVerboseFeedback() {
            return this.viewport.isShowVerboseFeedback();
        },

    },

    methods: {

        expand() {
            this.app.ui.expandable.expand(this.pipe.id);
        },

        collapse() {
            this.app.ui.expandable.collapse(this.pipe.id);
        },

        toggleExpand() {
            this.app.ui.expandable.toggleExpand(this.pipe.id);
        },

        onBarClick(ev) {
            this.app.ui.navigation.handleViewportNavigationClick(this.$refs.bar, ev);
        },

        onUiSelect() {
            this.viewport.selectItem(this.pipe);
        },

        onUiSelectToggle() {
            this.viewport.toggleSelectItem(this.pipe);
        },

        onUiSelectExpand() {
            this.viewport.expandSelectionTo(this.pipe);
        },

        onUiActivate() {
            if (!this.viewport.isSelected(this.pipe)) {
                this.viewport.selectItem(this.pipe);
            }
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showPipeItemMenu();
            }, 1);
        },

        getParam(name) {
            const param = this.pipe.getParams().find(_ => _.name === name);
            return param ? this.pipe[name] : null;
        },

        showCreateMenu() {
            this.viewport.selectItem(this.pipe);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreateMenu();
            }, 1);
        }

    }

};
</script>

<style scoped>
.pipe-item {
    position: relative;
    background: var(--color-warm--100);
    border-top: 2px solid var(--color-cool--800);
    border-left: 3px solid var(--color-warm--400);
}

.pipe-item--added { border-left-color: var(--color-green--500) }
.pipe-item--modified { border-left-color: var(--color-yellow--500) }

.pipe-item--disabled { opacity: .5 }

.bar {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: var(--gap--small);
    user-select: none;
}

.pipe-item--selected > .bar {
    background: var(--ui-selected-background-color);
}

.bar:focus {
    outline: 0;
    z-index: 2;
    box-shadow: 0 0 0 2px var(--border-shadow--focus) inset;
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

.bar-main,
.bar-aside {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

.bar-main {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
}

.expand {
    width: 1.25em;
    text-align: center;
}

/*
.icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 20px;
    width: 20px;
    height: 20px;
    margin: 0 var(--gap--small);
    border-radius: 100%;
    background: var(--pipe-other-color);
    color: #fff;
}

.icon::after { content: '#/' }

.pipe-item--dom > .bar .icon { background: var(--pipe-dom-color) }
.pipe-item--dom > .bar .icon::after { content: '#' }
.pipe-item--value > .bar .icon { background: var(--pipe-value-color) }
.pipe-item--value > .bar .icon::after { content: '{}' }
.pipe-item--other > .bar .icon { background: var(--pipe-other-color) }
.pipe-item--other > .bar .icon::after { content: '#/' }
.pipe-item--error > .bar .icon { background: var(--color-red--500) }
*/

.duration {
    font-size: var(--font-size--small);
    margin-right: var(--gap--small);
    text-align: center;
}

.duration--slow {
    color: var(--color-red--600);
}

.duration-time {
    font-size: 8px;
}

input.enabled {
    margin: 0;
}

.pipe-label {
    display: inline-flex;
    margin: 0 var(--gap--small);
    /* font-weight: 500; */
    overflow: hidden;
    text-overflow: ellipsis;
}

.pipe-ns {
    opacity: .5;
}

.hint {
    margin-right: var(--gap--small);
    padding: 2px 4px;
    border-radius: var(--border-radius);
    background: var(--color-mono--500);
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
}

.custom-label {
    background: var(--color-blue--500);
    cursor: pointer;
}

.body {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    /* A small grey line to preserve gray area below nested pipes with omitted result */
    /* padding-bottom: var(--gap--small); */
}

.result {
    position: relative;
    padding: var(--gap);
    background: var(--color-mono--300);
    border-top: 1px solid var(--color-mono--400);
}

/* Arrow business */

.arrow.arrow {
    --arrow-color: var(--color-warm--100);
}

.arrow--alt.arrow {
    --arrow-color: var(--color-mono--300);
}

.arrow--selected.arrow {
    --arrow-color: var(--ui-selected-background-color);
}

.pipe-item:focus-within .arrow--selected.arrow {
    --arrow-color: var(--border-shadow--focus);
}
</style>
