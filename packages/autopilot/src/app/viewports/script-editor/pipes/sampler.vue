<template>
    <div class="sampler"
        :class="{
            'sampler--spotlight': isSpotlightEnabled,
        }"
        @click="stopPropagation">

        <template v-if="outputSet">
            <div class="sampler__badge"
                @click="expanded = true">
                <span class="sampler__length">
                    &times; {{ outputSet.length }}
                </span>
            </div>

            <div
                class="sampler__popover"
                :class="{ 'sampler__popover--more': showMore }"
                v-if="expanded">
                <div
                    class="sampler__more"
                    v-if="hasMore"
                    @click="showMore = !showMore">
                    <i class="fas fa-plus" v-if="!showMore"></i>
                    <i class="fas fa-minus" v-if="showMore"></i>
                </div>
                <div class="sampler__els"
                    :class="{ 'results-switch__els--more': showMore }">
                    <div
                        class="sampler__el"
                        :class="{ 'sampler__el--active': isElSpotlighted(i) }"
                        v-for="(el, i) of elsSlice"
                        @mouseenter="highlightElement(el)"
                        @mouseleave="hideHighlight(el)"
                        @click="toggleSpotlight(i)">
                    </div>
                </div>
                <div class="sampler__length"
                    @click="expanded = false">
                    &times; {{ outputSet.length }}
                </div>
            </div>
        </template>

        <template v-if="error">
            <div class="sampler__badge sampler__badge--error"
                :title="error.message">
                ERR
            </div>
        </template>

    </div>
</template>

<script>
/**
 * Tiny rectangle with popover displayed in pipe's header with following responsibilities:
 *
 * - displays the length of pipe's output set
 * - on click reveals the output elements as tiny squares, which highlight page element on hover
 * - clicking element enables "spotlight" which artificially restricts the output set of this pipe
 *   to a single element; subsequent elements receive a reduced input, thus this feature is very useful
 *   for debugging
 * - if error is thrown, badge becomes red and displays an error instead
 */
export default {

    props: {
        pipelineController: { type: Object, required: true },
        pipe: { type: Object, required: true },
        outputSet: { type: Array },
        error: { required: false }
    },

    data() {
        return {
            expanded: this.isSpotlightEnabled,
            showMore: false
        };
    },

    computed: {

        elsSlice() {
            return this.showMore ? this.outputSet : this.outputSet.slice(0, 10);
        },

        hasMore() {
            return this.outputSet.length > 10;
        },

        isSpotlightEnabled() {
            return this.pipelineController.isPipeSpotlighted(this.pipe.id);
        }

    },

    methods: {
        highlightElement(el) {
            el.remote.highlight();
        },

        hideHighlight(el) {
            el.remote.hideHighlight();
        },

        stopPropagation(ev) {
            ev.stopPropagation();
        },

        toggleSpotlight(index) {
            if (this.isElSpotlighted(index)) {
                this.pipelineController.disableSpotlight();
            } else {
                this.pipelineController.enableSpotlight(this.pipe.id, index);
            }
        },

        isElSpotlighted(index) {
            return this.pipelineController.isElSpotlighted(this.pipe.id, index);
        }

    }

};
</script>

<style>
.sampler {
    position: relative;
    margin: 0 var(--gap--small);
    font-size: var(--font-size--small);
}

.sampler__badge {
    padding: 2px 4px;
    border: 1px solid var(--color-blue--500);
    border-radius: var(--border-radius);
    color: var(--color-blue--500);
    background: #fff;
}

.sampler__badge--error {
    color: var(--color-red--500);
    border-color: var(--color-red--500);
}

.sampler__length {
    white-space: nowrap;
    cursor: pointer;
}

.sampler__popover {
    position: absolute;
    z-index: 10;
    top: 0;
    right: 0;

    display: flex;
    flex-flow: row nowrap;

    padding: 2px 4px;
    border: 1px solid var(--color-blue--500);
    border-radius: var(--border-radius);
    color: #fff;
    background: var(--color-blue--500);
}

.sampler__popover--more {
    z-index: 100;
}

.sampler--spotlight .sampler__badge {
    background: var(--color-yellow--500);
    border-color: var(--color-yellow--500);
    color: #fff;
}

.sampler--spotlight .sampler__popover {
    background: var(--color-yellow--500);
    border-color: var(--color-yellow--500);
    color: #fff;
}

.sampler__els {
    display: flex;
    align-items: center;
    margin: 0 var(--gap--small);
}

.results-switch__els--more {
    flex-flow: row wrap;
    width: calc(10 * (8px + 2px));
}

.sampler__el {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    margin: 1px;
    background: #fff;

    cursor: pointer;
}

.sampler__el--active {
    background: var(--color-cool--800);
}
</style>
